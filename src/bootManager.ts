import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface BootEntry {
  identifier: string;
  device: string;
  description: string;
  locale: string;
  isCurrent: boolean;
}

export class BootManager {
  /**
   * 解析 bcdedit 输出，提取所有 Windows 启动项
   */
  static async getBootEntries(): Promise<BootEntry[]> {
    try {
      const { stdout } = await execPromise('bcdedit /enum', { encoding: 'utf8' });
      return this.parseBcdEdit(stdout);
    } catch (error) {
      throw new Error(`无法读取启动配置: ${error}`);
    }
  }

  /**
   * 解析 bcdedit 输出文本
   */
  private static parseBcdEdit(output: string): BootEntry[] {
    const entries: BootEntry[] = [];
    const sections = output.split(/\r?\n\r?\n/);

    let currentIdentifier = '';

    for (const section of sections) {
      const lines = section.split(/\r?\n/).map(line => line.trim()).filter(line => line);

      if (lines.length === 0) continue;

      // 查找 Windows 启动加载器部分
      const hasBootLoader = lines.some(line =>
        line.includes('Windows 启动加载器') ||
        line.includes('Windows Boot Loader')
      );

      if (!hasBootLoader) continue;

      const entry: Partial<BootEntry> = {
        identifier: '',
        device: '',
        description: '',
        locale: '',
        isCurrent: false
      };

      for (const line of lines) {
        // 提取标识符 (identifier)
        if (line.startsWith('标识符') || line.startsWith('identifier')) {
          const match = line.match(/\{([0-9a-f-]+)\}/i);
          if (match) {
            entry.identifier = match[0];
            currentIdentifier = match[0];

            // 检查是否为 {current}
            if (line.includes('{current}')) {
              entry.isCurrent = true;
            }
          }
        }

        // 提取设备 (device)
        if (line.startsWith('device') || line.startsWith('设备')) {
          entry.device = line.split(/\s+/).slice(1).join(' ');
        }

        // 提取描述 (description)
        if (line.startsWith('description') || line.startsWith('描述')) {
          entry.description = line.split(/\s+/).slice(1).join(' ');
        }

        // 提取区域设置 (locale)
        if (line.startsWith('locale') || line.startsWith('区域设置')) {
          entry.locale = line.split(/\s+/).slice(1).join(' ');
        }
      }

      // 只添加有效的启动项
      if (entry.identifier && entry.description) {
        entries.push(entry as BootEntry);
      }
    }

    return entries;
  }

  /**
   * 获取当前默认启动项
   */
  static async getCurrentDefault(): Promise<string> {
    try {
      const { stdout } = await execPromise('bcdedit', { encoding: 'utf8' });

      // 查找 default 行
      const lines = stdout.split(/\r?\n/);
      for (const line of lines) {
        if (line.includes('default') || line.includes('默认')) {
          const match = line.match(/\{([0-9a-f-]+)\}/i);
          if (match) {
            return match[0];
          }
        }
      }

      return '';
    } catch (error) {
      throw new Error(`无法获取默认启动项: ${error}`);
    }
  }

  /**
   * 设置默认启动项并重启
   */
  static async switchToSystem(identifier: string): Promise<void> {
    try {
      // 设置默认启动项
      await execPromise(`bcdedit /default ${identifier}`);

      // 取消等待时间
      await execPromise('bcdedit /timeout 0');

      // 延迟 1 秒后重启
      setTimeout(async () => {
        await execPromise('shutdown /r /t 0');
      }, 1000);

    } catch (error) {
      throw new Error(`切换系统失败: ${error}`);
    }
  }

  /**
   * 检查是否以管理员身份运行
   */
  static async isAdmin(): Promise<boolean> {
    try {
      await execPromise('net session');
      return true;
    } catch {
      return false;
    }
  }
}
