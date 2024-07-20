import Stats from 'stats-js';

export const useStats = () => {
  const stats = new Stats();
  document.body.append(stats.dom);
  return stats;
};
