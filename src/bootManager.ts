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
      // 使用 chcp 65001 切换到 UTF-8 编码，然后执行 bcdedit
      const { stdout } = await execPromise('chcp 65001 >nul && bcdedit /enum', {
        encoding: 'utf8',
        shell: 'cmd.exe'
      });

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

    // 按空行分割成多个段落
    const sections = output.split(/\r?\n\s*\r?\n/);

    for (const section of sections) {
      const lines = section.split(/\r?\n/).filter(line => line.trim());

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
        const trimmedLine = line.trim();

        // 提取标识符 (identifier) - 匹配格式: "标识符  {xxx}" 或 "identifier  {xxx}"
        if (trimmedLine.startsWith('标识符') || trimmedLine.startsWith('identifier')) {
          // 匹配所有格式，包括 UUID 和特殊标识符如 {default}, {current}
          const match = trimmedLine.match(/\{([0-9a-f-]+|default|current)\}/i);
          if (match) {
            entry.identifier = match[0];

            // 检查是否为 {current}
            if (match[0] === '{current}') {
              entry.isCurrent = true;
            }
          }
        }

        // 提取设备 (device) - 匹配格式: "device  partition=C:"
        if (trimmedLine.startsWith('device') || trimmedLine.startsWith('设备')) {
          const parts = trimmedLine.split(/\s+/);
          if (parts.length > 1) {
            entry.device = parts.slice(1).join(' ');
          }
        }

        // 提取描述 (description) - 匹配格式: "description  Windows"
        if (trimmedLine.startsWith('description') || trimmedLine.startsWith('描述')) {
          const parts = trimmedLine.split(/\s+/);
          if (parts.length > 1) {
            entry.description = parts.slice(1).join(' ');
          }
        }

        // 提取区域设置 (locale)
        if (trimmedLine.startsWith('locale') || trimmedLine.startsWith('区域设置')) {
          const parts = trimmedLine.split(/\s+/);
          if (parts.length > 1) {
            entry.locale = parts.slice(1).join(' ');
          }
        }
      }

      // 只添加有效的启动项（必须有标识符和描述）
      if (entry.identifier && entry.description) {
        entries.push(entry as BootEntry);
      }
    }

    // 检查是否有 {current} 标识的启动项
    const currentEntry = entries.find(entry => entry.isCurrent);

    if (currentEntry) {
      // 有 {current}：保留 {default} 和其他启动项，过滤掉 {current}
      return entries.filter(entry => !entry.isCurrent || entry.identifier === '{default}');
    } else {
      // 没有 {current}：过滤掉 {default}，其他启动项都保留
      return entries.filter(entry => entry.identifier !== '{default}');
    }
  }

  /**
   * 获取当前默认启动项
   */
  static async getCurrentDefault(): Promise<string> {
    try {
      const { stdout } = await execPromise('chcp 65001 >nul && bcdedit', {
        encoding: 'utf8',
        shell: 'cmd.exe'
      });

      // 查找 default 行
      const lines = stdout.split(/\r?\n/);
      for (const line of lines) {
        if (line.includes('default') || line.includes('默认')) {
          const match = line.match(/\{([0-9a-f-]+|default|current)\}/i);
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

      // 重启
      await execPromise('shutdown /r /t 0');

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
