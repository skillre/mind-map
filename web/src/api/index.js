import exampleData from 'simple-mind-map/example/exampleData'
import { simpleDeepClone } from 'simple-mind-map/src/utils/index'
import Vue from 'vue'
import vuexStore from '@/store'
import githubStorage from './githubStorage'

const SIMPLE_MIND_MAP_DATA = 'SIMPLE_MIND_MAP_DATA'
const SIMPLE_MIND_MAP_CONFIG = 'SIMPLE_MIND_MAP_CONFIG'
const SIMPLE_MIND_MAP_LANG = 'SIMPLE_MIND_MAP_LANG'
const SIMPLE_MIND_MAP_LOCAL_CONFIG = 'SIMPLE_MIND_MAP_LOCAL_CONFIG'

let mindMapData = null
let currentFileName = 'default.smm'

// 获取缓存的思维导图数据
export const getData = async () => {
  // 接管模式
  if (window.takeOverApp) {
    mindMapData = window.takeOverAppMethods.getMindMapData()
    return mindMapData
  }
  // 操作本地文件模式
  if (vuexStore.state.isHandleLocalFile) {
    return Vue.prototype.getCurrentData()
  }
  // GitHub存储模式
  if (vuexStore.state.isGitHubStorage) {
    try {
      const data = await githubStorage.getFileContent(currentFileName)
      return data || simpleDeepClone(exampleData)
    } catch (error) {
      console.error('从GitHub获取数据失败:', error)
      return simpleDeepClone(exampleData)
    }
  }
  let store = localStorage.getItem(SIMPLE_MIND_MAP_DATA)
  if (store === null) {
    return simpleDeepClone(exampleData)
  } else {
    try {
      return JSON.parse(store)
    } catch (error) {
      return simpleDeepClone(exampleData)
    }
  }
}

// 存储思维导图数据
export const storeData = async (data) => {
  try {
    let originData = null
    if (window.takeOverApp) {
      originData = mindMapData
    } else {
      originData = await getData()
    }
    if (!originData) {
      originData = {}
    }
    originData = {
      ...originData,
      ...data
    }
    if (window.takeOverApp) {
      mindMapData = originData
      window.takeOverAppMethods.saveMindMapData(originData)
      return
    }
    Vue.prototype.$bus.$emit('write_local_file', originData)
    if (vuexStore.state.isHandleLocalFile) {
      return
    }
    // GitHub存储模式
    if (vuexStore.state.isGitHubStorage) {
      try {
        await githubStorage.saveFileContent(currentFileName, originData)
        return
      } catch (error) {
        console.error('保存到GitHub失败:', error)
      }
    }
    localStorage.setItem(SIMPLE_MIND_MAP_DATA, JSON.stringify(originData))
  } catch (error) {
    console.log(error)
    if ('exceeded') {
      Vue.prototype.$bus.$emit('localStorageExceeded')
    }
  }
}

// 获取思维导图配置数据
export const getConfig = () => {
  if (window.takeOverApp) {
    window.takeOverAppMethods.getMindMapConfig()
    return
  }
  let config = localStorage.getItem(SIMPLE_MIND_MAP_CONFIG)
  if (config) {
    return JSON.parse(config)
  }
  return null
}

// 存储思维导图配置数据
export const storeConfig = config => {
  try {
    if (window.takeOverApp) {
      window.takeOverAppMethods.saveMindMapConfig(config)
      return
    }
    localStorage.setItem(SIMPLE_MIND_MAP_CONFIG, JSON.stringify(config))
  } catch (error) {
    console.log(error)
  }
}

// 存储语言
export const storeLang = lang => {
  if (window.takeOverApp) {
    window.takeOverAppMethods.saveLanguage(lang)
    return
  }
  localStorage.setItem(SIMPLE_MIND_MAP_LANG, lang)
}

// 获取存储的语言
export const getLang = () => {
  if (window.takeOverApp) {
    return window.takeOverAppMethods.getLanguage() || 'zh'
  }
  let lang = localStorage.getItem(SIMPLE_MIND_MAP_LANG)
  if (lang) {
    return lang
  }
  storeLang('zh')
  return 'zh'
}

// 存储本地配置
export const storeLocalConfig = config => {
  if (window.takeOverApp) {
    return window.takeOverAppMethods.saveLocalConfig(config)
  }
  localStorage.setItem(SIMPLE_MIND_MAP_LOCAL_CONFIG, JSON.stringify(config))
}

// 获取本地配置
export const getLocalConfig = () => {
  if (window.takeOverApp) {
    return window.takeOverAppMethods.getLocalConfig()
  }
  let config = localStorage.getItem(SIMPLE_MIND_MAP_LOCAL_CONFIG)
  if (config) {
    return JSON.parse(config)
  }
  return null
}

// GitHub存储相关函数
export const setCurrentFileName = (fileName) => {
  currentFileName = fileName || 'default.smm'
}

export const getCurrentFileName = () => {
  return currentFileName
}

export const getGitHubFileList = async () => {
  try {
    return await githubStorage.getFileList()
  } catch (error) {
    console.error('获取GitHub文件列表失败:', error)
    return []
  }
}

export const loadGitHubFile = async (fileName) => {
  try {
    const data = await githubStorage.getFileContent(fileName)
    if (data) {
      setCurrentFileName(fileName)
      return data
    }
    return null
  } catch (error) {
    console.error('加载GitHub文件失败:', error)
    throw error
  }
}

export const saveToGitHub = async (fileName, data) => {
  try {
    await githubStorage.saveFileContent(fileName, data)
    setCurrentFileName(fileName)
  } catch (error) {
    console.error('保存到GitHub失败:', error)
    throw error
  }
}

export const deleteGitHubFile = async (fileName) => {
  try {
    await githubStorage.deleteFile(fileName)
  } catch (error) {
    console.error('删除GitHub文件失败:', error)
    throw error
  }
}

export const initGitHubStorage = (config) => {
  githubStorage.init(config)
}

export const getGitHubConfig = () => {
  return githubStorage.getConfigFromLocal()
}

export const saveGitHubConfig = (config) => {
  githubStorage.saveConfigToLocal(config)
}

export const startAutoSave = (getDataCallback) => {
  if (vuexStore.state.isGitHubStorage) {
    githubStorage.startAutoSave(currentFileName, getDataCallback)
  }
}

export const stopAutoSave = () => {
  githubStorage.stopAutoSave()
}
