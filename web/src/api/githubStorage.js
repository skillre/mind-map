import axios from 'axios'

const GITHUB_API_BASE = 'https://api.github.com'

class GitHubStorage {
  constructor() {
    this.owner = ''
    this.repo = ''
    this.token = ''
    this.branch = 'main'
    this.path = 'mind-maps'
    this.autoSaveInterval = 5000 // 5秒自动保存
    this.autoSaveTimer = null
    this.lastSavedData = null
  }

  // 初始化配置
  init(config) {
    this.owner = config.owner
    this.repo = config.repo
    this.token = config.token
    this.branch = config.branch || 'main'
    this.path = config.path || 'mind-maps'
    this.enableAutoSave = config.enableAutoSave !== false
  }

  // 检查配置是否完整
  isConfigured() {
    return !!(this.owner && this.repo && this.token)
  }

  // 获取文件内容
  async getFileContent(fileName) {
    if (!this.isConfigured()) {
      throw new Error('GitHub存储未配置')
    }

    try {
      const url = `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${this.path}/${fileName}`
      const response = await axios.get(url, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (response.data.content) {
        const content = atob(response.data.content)
        return JSON.parse(content)
      }
      return null
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null // 文件不存在
      }
      throw error
    }
  }

  // 创建或更新文件
  async saveFileContent(fileName, content, message = null) {
    if (!this.isConfigured()) {
      throw new Error('GitHub存储未配置')
    }

    try {
      // 先获取现有文件以获取sha
      const filePath = `${this.path}/${fileName}`
      let sha = null

      try {
        const existingFile = await axios.get(
          `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
          {
            headers: {
              'Authorization': `token ${this.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        )
        sha = existingFile.data.sha
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          throw error
        }
        // 文件不存在，继续创建
      }

      const contentStr = JSON.stringify(content, null, 2)
      const encodedContent = btoa(contentStr)

      const response = await axios.put(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
        {
          message: message || `Update ${fileName} via mind-map`,
          content: encodedContent,
          branch: this.branch,
          sha: sha
        },
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )

      this.lastSavedData = JSON.stringify(content)
      return response.data
    } catch (error) {
      console.error('保存到GitHub失败:', error)
      throw error
    }
  }

  // 删除文件
  async deleteFile(fileName, message = null) {
    if (!this.isConfigured()) {
      throw new Error('GitHub存储未配置')
    }

    try {
      const filePath = `${this.path}/${fileName}`
      
      // 获取文件sha
      const existingFile = await axios.get(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )

      const response = await axios.delete(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
        {
          data: {
            message: message || `Delete ${fileName} via mind-map`,
            sha: existingFile.data.sha,
            branch: this.branch
          },
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('删除GitHub文件失败:', error)
      throw error
    }
  }

  // 获取文件列表
  async getFileList() {
    if (!this.isConfigured()) {
      throw new Error('GitHub存储未配置')
    }

    try {
      const url = `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${this.path}`
      const response = await axios.get(url, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      return response.data
        .filter(item => item.type === 'file' && item.name.endsWith('.smm'))
        .map(item => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          download_url: item.download_url,
          lastModified: new Date(item.commit?.author?.date || item.commit?.committer?.date)
        }))
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [] // 目录不存在
      }
      throw error
    }
  }

  // 开始自动保存
  startAutoSave(fileName, getDataCallback) {
    if (!this.enableAutoSave) return

    this.stopAutoSave()
    
    this.autoSaveTimer = setInterval(() => {
      const currentData = getDataCallback()
      const currentDataStr = JSON.stringify(currentData)
      
      if (currentDataStr !== this.lastSavedData) {
        this.saveFileContent(fileName, currentData)
          .then(() => {
            console.log('自动保存成功')
          })
          .catch(error => {
            console.error('自动保存失败:', error)
          })
      }
    }, this.autoSaveInterval)
  }

  // 停止自动保存
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  // 立即保存
  async saveNow(fileName, content) {
    return this.saveFileContent(fileName, content, `Save ${fileName} manually`)
  }

  // 保存配置到本地存储
  saveConfigToLocal(config) {
    localStorage.setItem('github_storage_config', JSON.stringify(config))
  }

  // 从本地存储获取配置
  getConfigFromLocal() {
    const config = localStorage.getItem('github_storage_config')
    return config ? JSON.parse(config) : null
  }

  // 清除本地配置
  clearConfig() {
    localStorage.removeItem('github_storage_config')
  }
}

export default new GitHubStorage()