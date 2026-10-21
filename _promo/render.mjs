// 把录到的帧序列 + 标题卡合成宣传片：
//   intro(4.5s) → 实拍(约 18s，1.55x 慢放 + 字幕条) → 三张卖点卡(各 4s) → 结尾 CTA(5s)
// 产物：MP4(H.264) / WebM(VP9) / GIF / poster.png，全部落在 docs/promo/media/。
//
// 用法: node scripts/promo/render.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const MEDIA = join(ROOT, 'docs/promo/media');
const FRAMES = join(MEDIA, '_frames');
const CARDS = join(MEDIA, '_cards');
const BUILD = join(MEDIA, '_build');
const FFMPEG = join(ROOT, '.tools/ffmpeg/ffmpeg.exe');
const SPEED = 1.55;
const FPS = 30;

const run = (args, label) => {
  console.log(`\n$ ffmpeg ${args.slice(0, 6).join(' ')} …  [${label}]`);
  const res = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
  if (res.status !== 0) throw new Error(`${label} failed:\n${res.stderr || res.stdout}`);
};

/** 统一的段落编码参数：concat -c copy 要求各段完全一致。 */
const SEG = [
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
  '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.0',
  '-r', String(FPS), '-vsync', 'cfr', '-movflags', '+faststart',
];

function buildFootage() {
  const timings = JSON.parse(readFileSync(join(MEDIA, 'timings.json'), 'utf8'));
  const frames = readdirSync(FRAMES).filter((f) => f.endsWith('.jpg')).sort();
  if (!frames.length) throw new Error('no frames captured');

  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const t = timings.frames[i]?.t ?? i * 0.033;
    const next = timings.frames[i + 1]?.t;
    let dur = next ? (next - t) * SPEED : 1 / FPS;
    dur = Math.min(0.6, Math.max(0.02, dur));
    lines.push(`file '${join(FRAMES, frames[i]).replace(/\\/g, '/')}'`);
    if (i < frames.length - 1) lines.push(`duration ${dur.toFixed(4)}`);
  }
  lines.push(`file '${join(FRAMES, frames[frames.length - 1]).replace(/\\/g, '/')}'`);
  const listPath = join(BUILD, 'frames.txt');
  writeFileSync(listPath, lines.join('\n'), 'utf8');

  run([
    '-f', 'concat', '-safe', '0', '-i', listPath,
    '-vf', `fps=${FPS},scale=1920:1080,fade=t=in:st=0:d=0.45`,
    ...SEG, join(BUILD, 'footage-raw.mp4'),
  ], 'footage raw');

  const rawDur = Number(
    spawnSync(FFMPEG, ['-hide_banner', '-i', join(BUILD, 'footage-raw.mp4')], { encoding: 'utf8' })
      .stderr.match(/Duration: (\d+):(\d+):([\d.]+)/)
      ?.slice(1).reduce((acc, v, i) => acc + Number(v) * [3600, 60, 1][i], 0) ?? 0,
  );
  const outfit = Math.max(0, rawDur - 0.6).toFixed(2);

  // 字幕条：0.4s–8.5s 第一条，9s–结尾第二条
  run([
    '-i', join(BUILD, 'footage-raw.mp4'),
    '-loop', '1', '-i', join(CARDS, 'cap-1.png'),
    '-loop', '1', '-i', join(CARDS, 'cap-2.png'),
    '-filter_complex',
    `[0:v][1:v]overlay=0:0:enable='between(t,0.4,8.6)'[a];` +
    `[a][2:v]overlay=0:0:enable='gte(t,9)'[b];` +
    `[b]fade=t=out:st=${outfit}:d=0.55[v]`,
    '-map', '[v]', ...SEG, join(BUILD, 'footage.mp4'),
  ], 'footage + captions');

  return rawDur;
}

function buildCard(name, seconds, out) {
  run([
    '-loop', '1', '-t', String(seconds), '-i', join(CARDS, name),
    '-vf', `fps=${FPS},scale=1920:1080,fade=t=in:st=0:d=0.5,fade=t=out:st=${(seconds - 0.5).toFixed(2)}:d=0.5`,
    ...SEG, join(BUILD, out),
  ], name);
}

function measure(file) {
  const res = spawnSync(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const m = res.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const v = res.stderr.match(/Video: .*?(\d{2,5})x(\d{2,5}).*?(\d+(?:\.\d+)?) fps/);
  return {
    seconds: m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0,
    width: v ? Number(v[1]) : 0,
    height: v ? Number(v[2]) : 0,
    fps: v ? Number(v[3]) : 0,
    bytes: statSync(file).size,
  };
}

function main() {
  if (!existsSync(FFMPEG)) throw new Error(`ffmpeg missing at ${FFMPEG}`);
  rmSync(BUILD, { recursive: true, force: true });
  mkdirSync(BUILD, { recursive: true });

  const footageDur = buildFootage();
  buildCard('card-intro.png', 4.5, 's1.mp4');
  buildCard('card-perm.png', 4.0, 's3.mp4');
  buildCard('card-plan.png', 4.0, 's4.mp4');
  buildCard('card-surfaces.png', 4.0, 's5.mp4');
  buildCard('card-outro.png', 5.0, 's6.mp4');

  const listPath = join(BUILD, 'segments.txt');
  writeFileSync(listPath, ['s1.mp4', 'footage.mp4', 's3.mp4', 's4.mp4', 's5.mp4', 's6.mp4']
    .map((f) => `file '${join(BUILD, f).replace(/\\/g, '/')}'`).join('\n'), 'utf8');

  const mp4 = join(MEDIA, 'deepseekcode-promo.mp4');
  run(['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', '-movflags', '+faststart', mp4], 'concat');

  const webm = join(MEDIA, 'deepseekcode-promo.webm');
  run([
    '-i', mp4, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0',
    '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1', '-an', webm,
  ], 'webm');

  const gif = join(MEDIA, 'deepseekcode-promo.gif');
  run([
    '-i', mp4,
    '-vf', `fps=11,scale=920:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3`,
    '-loop', '0', gif,
  ], 'gif');

  const poster = join(MEDIA, 'poster.png');
  run(['-ss', '7.5', '-i', mp4, '-frames:v', '1', poster], 'poster');

  const fpsFirst = Number(footageDur.toFixed(2));
  const info = {
    mp4: measure(mp4),
    webm: measure(webm),
    gif: measure(gif),
    footageSeconds: fpsFirst,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(join(MEDIA, 'video-meta.json'), JSON.stringify(info, null, 2));
  console.log('\n=== result ===');
  console.log(JSON.stringify(info, null, 2));
}

main();
