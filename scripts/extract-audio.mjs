// Losslessly extract an AAC track from an ordinary (non-fragmented) MP4.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw new Error('Usage: node scripts/extract-audio.mjs video.mp4 audio.m4a');
const input = await readFile(source);
function boxes(buffer, start = 0, end = buffer.length) {
  const result = [];
  for (let pos = start; pos < end;) {
    if (pos + 8 > end) throw new Error('Incomplete MP4 box');
    let size = buffer.readUInt32BE(pos), header = 8;
    if (size === 1) { size = Number(buffer.readBigUInt64BE(pos + 8)); header = 16; }
    if (size === 0) size = end - pos;
    if (size < header || pos + size > end) throw new Error('Invalid MP4 box');
    result.push({ type: buffer.toString('ascii', pos + 4, pos + 8), pos, size, header });
    pos += size;
  }
  return result;
}
const children = box => boxes(input, box.pos + box.header, box.pos + box.size);
const child = (box, type) => children(box).find(item => item.type === type);
const top = boxes(input), moov = top.find(box => box.type === 'moov');
if (!moov || top.some(box => box.type === 'moof')) throw new Error('Expected a non-fragmented MP4');
const track = children(moov).find(box => {
  if (box.type !== 'trak') return false;
  const handler = child(child(box, 'mdia'), 'hdlr');
  return input.toString('ascii', handler.pos + handler.header + 8, handler.pos + handler.header + 12) === 'soun';
});
if (!track) throw new Error('No audio track');
const mdia = child(track, 'mdia'), table = child(child(mdia, 'minf'), 'stbl');
const stsd = child(table, 'stsd');
if (input.toString('ascii', stsd.pos + 20, stsd.pos + 24) !== 'mp4a') throw new Error('Expected AAC audio');
const stco = child(table, 'stco'), stsc = child(table, 'stsc'), stsz = child(table, 'stsz');
if (!stco || !stsc || !stsz) throw new Error('Unsupported audio sample tables');
const chunkCount = input.readUInt32BE(stco.pos + 12);
const sampleSize = input.readUInt32BE(stsz.pos + 12), sampleCount = input.readUInt32BE(stsz.pos + 16);
const runs = Array.from({ length: input.readUInt32BE(stsc.pos + 12) }, (_, i) => ({
  first: input.readUInt32BE(stsc.pos + 16 + i * 12),
  samples: input.readUInt32BE(stsc.pos + 20 + i * 12),
}));
const audioTrack = Buffer.from(input.subarray(track.pos, track.pos + track.size));
const ftyp = Buffer.from('0000001c667479704d344120000002004d34412069736f6d6d703432', 'hex');
const movieHeader = child(moov, 'mvhd');
const movieSize = 8 + movieHeader.size + audioTrack.length;
const chunks = [];
let sample = 0, run = 0, offset = ftyp.length + movieSize + 8;
for (let index = 0; index < chunkCount; index++) {
  while (run + 1 < runs.length && runs[run + 1].first <= index + 1) run++;
  let length = 0;
  for (let n = 0; n < runs[run].samples; n++) {
    if (sample >= sampleCount) throw new Error('Invalid sample count');
    length += sampleSize || input.readUInt32BE(stsz.pos + 20 + sample * 4);
    sample++;
  }
  const originalOffset = input.readUInt32BE(stco.pos + 16 + index * 4);
  if (originalOffset + length > input.length) throw new Error('Incomplete audio data');
  chunks.push(input.subarray(originalOffset, originalOffset + length));
  audioTrack.writeUInt32BE(offset, stco.pos - track.pos + 16 + index * 4);
  offset += length;
}
if (sample !== sampleCount) throw new Error('Audio samples missing');
function header(type, size) {
  const result = Buffer.alloc(8); result.writeUInt32BE(size); result.write(type, 4); return result;
}
const output = Buffer.concat([ftyp, header('moov', movieSize), input.subarray(movieHeader.pos, movieHeader.pos + movieHeader.size), audioTrack, header('mdat', offset - ftyp.length - movieSize), ...chunks]);
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, output);
const mdhd = child(mdia, 'mdhd');
const seconds = input.readUInt32BE(mdhd.pos + 24) / input.readUInt32BE(mdhd.pos + 20);
console.log(JSON.stringify({ file: destination, bytes: output.length, seconds, samples: sample, chunks: chunkCount, codec: 'AAC (copied without re-encoding)' }));
