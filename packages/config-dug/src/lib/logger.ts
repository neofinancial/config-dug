import chalk from 'chalk';

const logger = {
  debug: function (...message: any[]): void {
    console.log(`${chalk.gray('DEBUG')}:`, ...message);
  },
  info: function (...message: any[]): void {
    console.log(`${chalk.cyan('INFO')}:`, ...message);
  },
  warn: function (...message: any[]): void {
    console.log(`${chalk.yellow('WARN')}:`, ...message);
  },
  error: function (...message: any[]): void {
    console.log(`${chalk.red('ERROR')}:`, ...message);
  },
};

export { logger };
