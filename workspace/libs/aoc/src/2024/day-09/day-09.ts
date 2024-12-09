import { Puzzle } from "../../types/puzzle.ts";

interface Segment {
  id: number | null;
  index: number;
  size: number;
}

const parseSizes = (content: string) => content.split("").map((n) => +n);

const compactTightChecksum = (sizes: number[]): number => {
  let freeSize = 0;
  let fileSize = 0;
  for (let i = 0; i < sizes.length; ++i) {
    if (i % 2 === 0) {
      fileSize += sizes[i];
    } else {
      freeSize += sizes[i];
    }
  }
  const totalSize = fileSize + freeSize;

  const segments = new Array(totalSize).fill(null);
  const fileSegments: Segment[] = Array(fileSize);
  const freeSegments: Segment[] = Array(freeSize);

  for (let i = 0, fileId = 0, offset = 0, fileIndex = 0, freeIndex = 0; i < sizes.length; offset += sizes[i++]) {
    const value = sizes[i];
    const endAt = offset + value;

    if (i % 2 === 0) {
      for (let j = offset; j < endAt; ++j) {
        segments[j] = fileId;
        fileSegments[fileIndex++] = { id: fileId, index: j, size: 1 };
      }

      ++fileId;
    } else {
      for (let j = offset; j < endAt; ++j) {
        segments[j] = null;
        freeSegments[freeIndex++] = { id: null, index: j, size: 1 };
      }
    }
  }

  freeSegments.reverse();
  while (freeSegments.length > 0) {
    const noneAt = segments.indexOf(null);
    const file = fileSegments.pop()!;

    if (noneAt > file.index) break;

    const free = freeSegments.pop()!;
    segments[free.index] = file.id;
    segments[file.index] = null;
  }

  let checksum = 0;
  for (let i = 0; i < segments.length; ++i) {
    if (segments[i] === null) break;
    checksum += i * segments[i];
  }
  return checksum;
};

const compactLooseChecksum = (sizes: number[]): number => {
  const segments: Segment[] = [];

  for (let i = 0, fileId = 0, offset = 0; i < sizes.length; offset += sizes[i++]) {
    if (i % 2 === 0) {
      segments.push({ id: fileId++, index: offset, size: sizes[i] });
    } else {
      segments.push({ id: null, index: offset, size: sizes[i] });
    }
  }

  for (let i = segments.length - 1; i > 0; --i) {
    const some = segments[i];
    if (some.id === null) continue;

    for (let j = 0; j < i; ++j) {
      const none = segments[j];
      if (none.id !== null || none.size < some.size) continue;

      segments.splice(i, 1);
      some.index = none.index;
      segments.splice(j, 0, some);

      none.size -= some.size;
      none.index += some.size;
      break;
    }
  }

  let checksum = 0;
  for (let i = 0; i < segments.length; i++) {
    const { id, index, size } = segments[i];
    if (id === null) continue;

    checksum += ((index * 2 + size - 1) * size / 2) * id;
  }

  return checksum;
};

export default Puzzle.new({
  prepare: parseSizes,
  easy: compactTightChecksum,
  hard: compactLooseChecksum,
});
