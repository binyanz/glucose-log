import {
  Skia, FilterMode, MipmapMode, TileMode, ImageFormat,
} from '@shopify/react-native-skia';
import { File, Directory, Paths } from 'expo-file-system';

/**
 * Turns a meal photo into a small "cartoon" illustration and discards the
 * original: posterized colour blocks with a dark Sobel-edge outline, done
 * entirely on-device via a Skia shader - no photo ever leaves the phone for
 * this step, and the flattened result compresses far smaller than the source
 * photo (fewer distinct colours, no sensor noise/texture to encode).
 *
 * This is a deliberately simple two-pass effect, not a generative model: a
 * resize pass for a stable working resolution, then one shader pass that
 * posterizes colour and darkens strong edges. It reads as "simplified
 * illustration", not as fine line art - documented as such rather than
 * oversold.
 */

const WORK_SIZE = 480;       // longest edge of the stored image, px
const POSTERIZE_LEVELS = 6;  // colour steps per channel
const JPEG_QUALITY = 80;

const CARTOON_SKSL = `
uniform shader image;
uniform float levels;

half4 main(float2 xy) {
  half3 luma3 = half3(0.299, 0.587, 0.114);
  half4 c = image.eval(xy);

  half tl = dot(image.eval(xy + float2(-1.0,-1.0)).rgb, luma3);
  half t  = dot(image.eval(xy + float2( 0.0,-1.0)).rgb, luma3);
  half tr = dot(image.eval(xy + float2( 1.0,-1.0)).rgb, luma3);
  half l  = dot(image.eval(xy + float2(-1.0, 0.0)).rgb, luma3);
  half r  = dot(image.eval(xy + float2( 1.0, 0.0)).rgb, luma3);
  half bl = dot(image.eval(xy + float2(-1.0, 1.0)).rgb, luma3);
  half b  = dot(image.eval(xy + float2( 0.0, 1.0)).rgb, luma3);
  half br = dot(image.eval(xy + float2( 1.0, 1.0)).rgb, luma3);

  half gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  half gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
  half edge = smoothstep(0.12, 0.35, sqrt(gx*gx + gy*gy));

  half3 posterized = floor(c.rgb * levels + 0.5) / levels;
  half3 outc = mix(posterized, half3(0.14, 0.12, 0.10), edge);

  return half4(outc, c.a);
}
`;

export type StylizeResult = { uri: string; width: number; height: number };

export async function stylizeMealPhoto(sourceUri: string): Promise<StylizeResult> {
  const data = await Skia.Data.fromURI(sourceUri);
  const source = Skia.Image.MakeImageFromEncoded(data);
  if (!source) throw new Error('Could not read that photo.');

  const scale = WORK_SIZE / Math.max(source.width(), source.height());
  const w = Math.max(1, Math.round(source.width() * scale));
  const h = Math.max(1, Math.round(source.height() * scale));

  // Pass 1: downscale to a stable working resolution with smooth filtering.
  const resizeSurface = Skia.Surface.MakeOffscreen(w, h);
  if (!resizeSurface) throw new Error('Could not allocate a drawing surface.');
  resizeSurface.getCanvas().drawImageRectOptions(
    source,
    Skia.XYWHRect(0, 0, source.width(), source.height()),
    Skia.XYWHRect(0, 0, w, h),
    FilterMode.Linear,
    MipmapMode.None,
  );
  const resized = resizeSurface.makeImageSnapshot();

  // Pass 2: posterize + edge-outline shader over the resized image.
  const effect = Skia.RuntimeEffect.Make(CARTOON_SKSL);
  if (!effect) throw new Error('Could not compile the stylize effect.');
  const imageShader = resized.makeShaderOptions(
    TileMode.Clamp, TileMode.Clamp, FilterMode.Nearest, MipmapMode.None,
  );
  const shader = effect.makeShaderWithChildren([POSTERIZE_LEVELS], [imageShader]);

  const effectSurface = Skia.Surface.MakeOffscreen(w, h);
  if (!effectSurface) throw new Error('Could not allocate a drawing surface.');
  const paint = Skia.Paint();
  paint.setShader(shader);
  effectSurface.getCanvas().drawPaint(paint);
  const final = effectSurface.makeImageSnapshot();

  const bytes = final.encodeToBytes(ImageFormat.JPEG, JPEG_QUALITY);
  if (!bytes) throw new Error('Could not encode the stylized image.');

  const dir = new Directory(Paths.document, 'meal-photos');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, `meal-${Date.now()}.jpg`);
  file.write(bytes);

  return { uri: file.uri, width: w, height: h };
}

export function deleteMealPhoto(uri: string): void {
  const file = new File(uri);
  if (file.exists) file.delete();
}
