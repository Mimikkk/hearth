import { Puzzle } from "../../types/puzzle.ts";

interface Segment {
  id: number | null;
  index: number;
  size: number;
}

const parseSizes = (content: string) => content.split("").map((n) => +n);

const compactTightChecksum = (sizes: number[]): number => {
  let total = 0;
  for (let i = 0; i < sizes.length; ++i) {
    total += sizes[i];
  }

  const blocks: (number | null)[] = Array(total);
  for (let i = 0, fileId = 0, blockId = 0; i < sizes.length; ++i) {
    const size = sizes[i];

    if (i % 2 === 0) {
      for (let j = 0; j < size; ++j) {
        blocks[blockId++] = fileId;
      }

      ++fileId;
    } else {
      for (let j = 0; j < size; ++j) {
        blocks[blockId++] = null;
      }
    }
  }

  let i = 0;
  let j = blocks.length - 1;
  while (i < j) {
    while (blocks[i] !== null && i < blocks.length) ++i;
    while (blocks[j] === null && j >= 0) --j;

    if (i < j) {
      const block = blocks[i];
      blocks[i] = blocks[j];
      blocks[j] = block;
    }

    ++i;
    --j;
  }

  let checksum = 0;
  for (let i = 0; i < blocks.length; i++) {
    const value = blocks[i];
    if (value === null) continue;

    checksum += value * i;
  }

  return checksum;
};

const compactLooseChecksum = (sizes: number[]): number => {
  const segments: Segment[] = Array(sizes.length);

  for (let i = 0, fileId = 0, offset = 0; i < sizes.length; offset += sizes[i++]) {
    if (i % 2 === 0) {
      segments[i] = { id: fileId++, index: offset, size: sizes[i] };
    } else {
      segments[i] = { id: null, index: offset, size: sizes[i] };
    }
  }

  for (let i = segments.length - 1; i > 0; --i) {
    const some = segments[i];
    if (some.id === null) continue;

    for (let j = 0; j < i; ++j) {
      const none = segments[j];
      if (none.id !== null || none.size < some.size) continue;

      for (let k = i - 1; k >= j; --k) segments[k + 1] = segments[k];
      segments[j] = some;
      some.index = none.index;

      none.size = none.size - some.size;
      none.index = none.index + some.size;
      segments[j + 1] = none;

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
