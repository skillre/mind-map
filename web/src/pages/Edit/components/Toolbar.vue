<template>
  <div class="toolbarContainer" :class="{ isDark: isDark }">
    <div class="toolbar" ref="toolbarRef">
      <!-- 节点操作 -->
      <div class="toolbarBlock">
        <ToolbarNodeBtnList :list="horizontalList"></ToolbarNodeBtnList>
        <!-- 更多 -->
        <el-popover
          v-model="popoverShow"
          placement="bottom-end"
          width="120"
          trigger="hover"
          v-if="showMoreBtn"
          :style="{ marginLeft: horizontalList.length > 0 ? '20px' : 0 }"
        >
          <ToolbarNodeBtnList
            dir="v"
            :list="verticalList"
            @click.native="popoverShow = false"
          ></ToolbarNodeBtnList>
          <div slot="reference" class="toolbarBtn">
            <span class="icon iconfont icongongshi"></span>
            <span class="text">{{ $t('toolbar.more') }}</span>
          </div>
        </el-popover>
      </div>
      <!-- 导出 -->
      <div class="toolbarBlock">
        <div class="toolbarBtn" @click="openDirectory" v-if="!isMobile">
          <span class="icon iconfont icondakai"></span>
          <span class="text">{{ $t('toolbar.directory') }}</span>
        </div>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.newFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div class="toolbarBtn" @click="createNewLocalFile">
            <span class="icon iconfont iconxinjian"></span>
            <span class="text">{{ $t('toolbar.newFile') }}</span>
          </div>
        </el-tooltip>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.openFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div class="toolbarBtn" @click="openLocalFile">
            <span class="icon iconfont iconwenjian1"></span>
            <span class="text">{{ $t('toolbar.openFile') }}</span>
          </div>
        </el-tooltip>
        <div class="toolbarBtn" @click="saveLocalFile" v-if="!isMobile">
          <span class="icon iconfont iconlingcunwei"></span>
          <span class="text">{{ $t('toolbar.saveAs') }}</span>
        </div>
        <div class="toolbarBtn" @click="$bus.$emit('showImport')">
          <span class="icon iconfont icondaoru"></span>
          <span class="text">{{ $t('toolbar.import') }}</span>
        </div>
        <div
          class="toolbarBtn"
          @click="$bus.$emit('showExport')"
          style="margin-right: 0;"
        >
          <span class="icon iconfont iconexport"></span>
          <span class="text">{{ $t('toolbar.export') }}</span>
        </div>
        <div
          class="toolbarBtn"
          @click="toggleGitHubStorage"
          :class="{ active: isGitHubStorage }"
        >
          <span class="icon iconfont icongithub"></span>
          <span class="text">{{ isGitHubStorage ? $t('toolbar.githubOn') : $t('toolbar.github') }}</span>
        </div>
        <!-- 本地文件树 -->
        <div
          class="fileTreeBox"
          v-if="fileTreeVisible"
          :class="{ expand: fileTreeExpand }"
        >
          <div class="fileTreeToolbar">
            <div class="fileTreeName">
              {{ rootDirName ? '/' + rootDirName : '' }}
            </div>
            <div class="fileTreeActionList">
              <div
                class="btn"
                :class="[
                  fileTreeExpand ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
                ]"
                @click="fileTreeExpand = !fileTreeExpand"
              ></div>
              <div
                class="btn el-icon-close"
                @click="fileTreeVisible = false"
              ></div>
            </div>
          </div>
          <div class="fileTreeWrap">
            <el-tree
              :props="fileTreeProps"
              :load="loadFileTreeNode"
              :expand-on-click-node="false"
              node-key="id"
              lazy
            >
              <span class="customTreeNode" slot-scope="{ node, data }">
                <div class="treeNodeInfo">
                  <span
                    class="treeNodeIcon iconfont"
                    :class="[
                      data.type === 'file' ? 'iconwenjian' : 'icondakai'
                    ]"
                  ></span>
                  <span class="treeNodeName">{{ node.label }}</span>
                </div>
                <div class="treeNodeBtnList" v-if="data.type === 'file'">
                  <el-button
                    type="text"
                    size="mini"
                    v-if="data.enableEdit"
                    @click="editLocalFile(data)"
                    >编辑</el-button
                  >
                  <el-button
                    type="text"
                    size="mini"
                    v-else
                    @click="importLocalFile(data)"
                    >导入</el-button
                  >
                </div>
              </span>
            </el-tree>
          </div>
        </div>
      </div>
    </div>
    <NodeImage></NodeImage>
    <NodeHyperlink></NodeHyperlink>
    <NodeIcon></NodeIcon>
    <NodeNote></NodeNote>
    <NodeTag></NodeTag>
    <Export></Export>
    <Import ref="ImportRef"></Import>
  </div>
</template>

<script>
import NodeImage from './NodeImage.vue'
import NodeHyperlink from './NodeHyperlink.vue'
import NodeIcon from './NodeIcon.vue'
import NodeNote from './NodeNote.vue'
import NodeTag from './NodeTag.vue'
import Export from './Export.vue'
import Import from './Import.vue'
import { mapState } from 'vuex'
import { Notification } from 'element-ui'
import exampleData from 'simple-mind-map/example/exampleData'
import { getData } from '../../../api'
import ToolbarNodeBtnList from './ToolbarNodeBtnList.vue'
import { throttle, isMobile } from 'simple-mind-map/src/utils/index'

// 工具栏
let fileHandle = null
const defaultBtnList = [
  'back',
  'forward',
  'painter',
  'siblingNode',
  'childNode',
  'deleteNode',
  'image',
  'icon',
  'link',
  'note',
  'tag',
  'summary',
  'associativeLine',
  'formula',
  // 'attachment',
  'outerFrame',
  'annotation',
  'ai'
]

export default {
  components: {
    NodeImage,
    NodeHyperlink,
    NodeIcon,
    NodeNote,
    NodeTag,
    Export,
    Import,
    ToolbarNodeBtnList
  },
  data() {
    return {
      isMobile: isMobile(),
      horizontalList: [],
      verticalList: [],
      showMoreBtn: true,
      popoverShow: false,
      fileTreeProps: {
        label: 'name',
        children: 'children',
        isLeaf: 'leaf'
      },
      fileTreeVisible: false,
      rootDirName: '',
      fileTreeExpand: true,
      waitingWriteToLocalFile: false
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark,
      isHandleLocalFile: state => state.isHandleLocalFile,
      isGitHubStorage: state => state.isGitHubStorage,
      openNodeRichText: state => state.localConfig.openNodeRichText,
      enableAi: state => state.localConfig.enableAi
    }),

    btnLit() {
      let res = [...defaultBtnList]
      if (!this.openNodeRichText) {
        res = res.filter(item => {
          return item !== 'formula'
        })
      }
      if (!this.enableAi) {
        res = res.filter(item => {
          return item !== 'ai'
        })
      }
      return res
    }
  },
  watch: {
    isHandleLocalFile(val) {
      if (!val) {
        Notification.closeAll()
      }
    },
    btnLit: {
      deep: true,
      handler() {
        this.computeToolbarShow()
      }
    }
  },
  created() {
    this.$bus.$on('write_local_file', this.onWriteLocalFile)
  },
  mounted() {
    this.computeToolbarShow()
    this.computeToolbarShowThrottle = throttle(this.computeToolbarShow, 300)
    window.addEventListener('resize', this.computeToolbarShowThrottle)
    this.$bus.$on('lang_change', this.computeToolbarShowThrottle)
    window.addEventListener('beforeunload', this.onUnload)
    this.$bus.$on('node_note_dblclick', this.onNodeNoteDblclick)
    
    // 添加调试信息
    const support = this.checkFileSystemSupport()
    console.log('File System Access API支持情况:', support)
    if (support.isSafari) {
      console.log('当前Safari版本:', support.safariVersion)
    }
  },
  beforeDestroy() {
    this.$bus.$off('write_local_file', this.onWriteLocalFile)
    window.removeEventListener('resize', this.computeToolbarShowThrottle)
    this.$bus.$off('lang_change', this.computeToolbarShowThrottle)
    window.removeEventListener('beforeunload', this.onUnload)
    this.$bus.$off('node_note_dblclick', this.onNodeNoteDblclick)
  },
  methods: {
    // 计算工具按钮如何显示
    computeToolbarShow() {
      if (!this.$refs.toolbarRef) return
      const windowWidth = window.innerWidth - 40
      const all = [...this.btnLit]
      let index = 1
      const loopCheck = () => {
        if (index > all.length) return done()
        this.horizontalList = all.slice(0, index)
        this.$nextTick(() => {
          const width = this.$refs.toolbarRef.getBoundingClientRect().width
          if (width < windowWidth) {
            index++
            loopCheck()
          } else if (index > 0 && width > windowWidth) {
            index--
            this.horizontalList = all.slice(0, index)
            done()
          }
        })
      }
      const done = () => {
        this.verticalList = all.slice(index)
        this.showMoreBtn = this.verticalList.length > 0
      }
      loopCheck()
    },

    // 监听本地文件读写
    onWriteLocalFile(content) {
      clearTimeout(this.timer)
      if (fileHandle && this.isHandleLocalFile) {
        this.waitingWriteToLocalFile = true
      }
      this.timer = setTimeout(() => {
        this.writeLocalFile(content)
      }, 1000)
    },

    onUnload(e) {
      if (this.waitingWriteToLocalFile) {
        const msg = '存在未保存的数据'
        e.returnValue = msg
        return msg
      }
    },

    // 加载本地文件树
    async loadFileTreeNode(node, resolve) {
      try {
        const support = this.checkFileSystemSupport()
        if (!support.showDirectoryPicker) {
          this.handleFileSystemError(
            new Error('showDirectoryPicker not supported'),
            'showDirectoryPicker'
          )
          resolve([])
          return
        }

        let dirHandle
        if (node.level === 0) {
          dirHandle = await window.showDirectoryPicker()
          this.rootDirName = dirHandle.name
        } else {
          dirHandle = node.data.handle
        }
        const dirList = []
        const fileList = []
        for await (const [key, value] of dirHandle.entries()) {
          const isFile = value.kind === 'file'
          if (isFile && !/\.(smm|xmind|md|json)$/.test(value.name)) {
            continue
          }
          const enableEdit = isFile && /\.smm$/.test(value.name)
          const data = {
            id: key,
            name: value.name,
            type: value.kind,
            handle: value,
            leaf: isFile,
            enableEdit
          }
          if (isFile) {
            fileList.push(data)
          } else {
            dirList.push(data)
          }
        }
        resolve([...dirList, ...fileList])
      } catch (error) {
        this.handleFileSystemError(error, 'showDirectoryPicker')
        this.fileTreeVisible = false
        resolve([])
      }
    },

    // 扫描本地文件夹
    openDirectory() {
      this.fileTreeVisible = false
      this.fileTreeExpand = true
      this.rootDirName = ''
      this.$nextTick(() => {
        this.fileTreeVisible = true
      })
    },

    // 编辑指定文件
    editLocalFile(data) {
      if (data.handle) {
        fileHandle = data.handle
        this.readFile()
      }
    },

    // 导入指定文件
    async importLocalFile(data) {
      try {
        const file = await data.handle.getFile()
        this.$refs.ImportRef.onChange({
          raw: file,
          name: file.name
        })
        this.$refs.ImportRef.confirm()
      } catch (error) {
        console.log(error)
      }
    },

    // 获取Safari版本
    getSafariVersion() {
      const userAgent = navigator.userAgent
      // 更新正则表达式以匹配更多版本格式，包括最新的Safari版本
      const safariMatch = userAgent.match(/version\/(\d+(?:\.\d+)*)/i)
      return safariMatch ? safariMatch[1] : 'unknown'
    },

    // 检测File System Access API支持情况
    checkFileSystemSupport() {
      const support = {
        showDirectoryPicker: 'showDirectoryPicker' in window,
        showOpenFilePicker: 'showOpenFilePicker' in window,
        showSaveFilePicker: 'showSaveFilePicker' in window,
        FileSystemFileHandle: 'FileSystemFileHandle' in window,
        FileSystemDirectoryHandle: 'FileSystemDirectoryHandle' in window
      }
      
      // Safari特定检测
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      
      // 在Safari中，即使API存在，也可能因为权限或其他原因无法使用
      // 因此需要更细致的检测
      if (isSafari) {
        // 获取Safari版本
        const safariVersion = this.getSafariVersion()
        // Safari 15.4+ 才开始支持File System Access API
        const versionParts = safariVersion.split('.').map(Number)
        const majorVersion = versionParts[0] || 0
        const minorVersion = versionParts[1] || 0
        
        // 如果版本低于15.4，则认为不支持
        if (majorVersion < 15 || (majorVersion === 15 && minorVersion < 4)) {
          return {
            ...support,
            isSafari,
            allSupported: false,
            safariVersion
          }
        }
      }
      
      return {
        ...support,
        isSafari,
        allSupported: Object.values(support).every(Boolean),
        safariVersion: isSafari ? this.getSafariVersion() : null
      }
    },

    // 详细的错误处理
    handleFileSystemError(error, apiType) {
      console.error(`${apiType} 错误:`, error)
      
      const support = this.checkFileSystemSupport()
      
      // 如果是Safari且版本过低
      if (support.isSafari && !support.allSupported) {
        this.$message.error(
          `Safari ${support.safariVersion} 不支持完整的File System Access API。请升级到Safari 15.4+。`
        )
        return
      }
      
      // 如果是Safari且版本符合要求，但仍报错，则可能是权限问题
      if (support.isSafari && support.allSupported) {
        if (error.name === 'NotAllowedError') {
          this.$message.error(
            '权限被拒绝。请确保：\n1. 网站使用HTTPS协议访问\n2. Safari偏好设置中已允许文件访问\n3. 重新加载页面后重试'
          )
        } else if (error.name === 'AbortError') {
          // 用户取消，静默处理
          return
        } else if (error.name === 'SecurityError') {
          this.$message.error(
            '安全错误：请确保网站通过HTTPS协议访问，且不在隐私浏览模式下'
          )
        } else {
          // 其他错误，给出通用提示
          this.$message.error(
            `操作失败：${error.message || '未知错误'}。请检查Safari设置或尝试使用其他浏览器。`
          )
        }
        return
      }
      
      // 非Safari浏览器的错误处理保持不变
      if (error.name === 'NotAllowedError') {
        this.$message.error(
          '权限被拒绝。请确保：\n1. 网站使用HTTPS\n2. 浏览器已允许文件访问\n3. 重新加载页面后重试'
        )
      } else if (error.name === 'AbortError') {
        // 用户取消，静默处理
        return
      } else if (error.name === 'SecurityError') {
        this.$message.error(
          '安全错误：请确保网站通过HTTPS访问，且不在隐私浏览模式下'
        )
      } else {
        this.$message.error(
          `操作失败：${error.message || '未知错误'}。请检查浏览器设置或尝试使用其他浏览器。`
        )
      }
    },

    // 打开本地文件
    async openLocalFile() {
      const support = this.checkFileSystemSupport()
      
      // 如果是Safari且不支持File System Access API，则使用传统方式
      if (support.isSafari && !support.allSupported) {
        this.openLocalFileTraditional()
        return
      }
      
      try {
        if (!support.showOpenFilePicker) {
          this.handleFileSystemError(
            new Error('showOpenFilePicker not supported'),
            'showOpenFilePicker'
          )
          return
        }

        let [_fileHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: '',
              accept: {
                'application/json': ['.smm']
              }
            }
          ],
          excludeAcceptAllOption: true,
          multiple: false
        })
        if (!_fileHandle) {
          return
        }
        fileHandle = _fileHandle
        if (fileHandle.kind === 'directory') {
          this.$message.warning(this.$t('toolbar.selectFileTip'))
          return
        }
        this.readFile()
      } catch (error) {
        this.handleFileSystemError(error, 'showOpenFilePicker')
      }
    },

    // 使用传统方式打开本地文件（用于Safari等不支持File System Access API的浏览器）
    openLocalFileTraditional() {
      // 创建input元素
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.smm'
      input.style.display = 'none'
      
      // 监听change事件
      input.onchange = (event) => {
        const file = event.target.files[0]
        if (file) {
          // 读取文件内容
          const fileReader = new FileReader()
          fileReader.onload = () => {
            this.$store.commit('setIsHandleLocalFile', true)
            this.setData(fileReader.result)
            Notification.closeAll()
            Notification({
              title: this.$t('toolbar.tip'),
              message: `${this.$t('toolbar.editingLocalFileTipFront')}${
                file.name
              }${this.$t('toolbar.editingLocalFileTipEnd')}`,
              duration: 0,
              showClose: true
            })
          }
          fileReader.readAsText(file)
        }
      }
      
      // 触发点击事件
      document.body.appendChild(input)
      input.click()
      document.body.removeChild(input)
    },

    // 创建本地文件
    async createLocalFile(content) {
      const support = this.checkFileSystemSupport()
      
      // 如果是Safari且不支持File System Access API，则使用传统方式
      if (support.isSafari && !support.allSupported) {
        this.createLocalFileTraditional(content)
        return
      }
      
      try {
        if (!support.showSaveFilePicker) {
          this.handleFileSystemError(
            new Error('showSaveFilePicker not supported'),
            'showSaveFilePicker'
          )
          return
        }

        let _fileHandle = await window.showSaveFilePicker({
          types: [
            {
              description: '',
              accept: { 'application/json': ['.smm'] }
            }
          ],
          suggestedName: this.$t('toolbar.defaultFileName')
        })
        if (!_fileHandle) {
          return
        }
        const loading = this.$loading({
          lock: true,
          text: this.$t('toolbar.creatingTip'),
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        fileHandle = _fileHandle
        this.$store.commit('setIsHandleLocalFile', true)
        this.isFullDataFile = true
        await this.writeLocalFile(content)
        await this.readFile()
        loading.close()
      } catch (error) {
        this.handleFileSystemError(error, 'showSaveFilePicker')
      }
    },

    // 使用传统方式创建/保存本地文件（用于Safari等不支持File System Access API的浏览器）
    createLocalFileTraditional(content) {
      try {
        // 准备数据
        let dataToSave = content
        if (!this.isFullDataFile) {
          dataToSave = content.root
        }
        const string = JSON.stringify(dataToSave)
        
        // 创建Blob对象
        const blob = new Blob([string], { type: 'application/json' })
        
        // 创建临时a标签用于下载
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = this.$t('toolbar.defaultFileName') + '.smm'
        a.style.display = 'none'
        
        // 触发下载
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        // 释放Blob URL
        URL.revokeObjectURL(a.href)
        
        this.$message.success(this.$t('toolbar.fileSavedSuccess'))
      } catch (error) {
        console.error('保存文件失败:', error)
        this.$message.error(this.$t('toolbar.fileSaveFailed'))
      }
    }

    onNodeNoteDblclick(node, e) {
      e.stopPropagation()
      this.$bus.$emit('showNodeNote', node)
    },

    // 切换GitHub存储模式
    toggleGitHubStorage() {
      if (this.isGitHubStorage) {
        // 如果当前是GitHub存储，则关闭
        this.$store.commit('setIsGitHubStorage', false)
        this.$message.success(this.$t('toolbar.githubOff'))
      } else {
        // 如果当前不是GitHub存储，则打开配置对话框
        this.$bus.$emit('showGitHubConfig')
      }
    }
  }
}
</script>

<style lang="less" scoped>
.toolbarContainer {
  &.isDark {
    .toolbar {
      color: hsla(0, 0%, 100%, 0.9);
      .toolbarBlock {
        background-color: #262a2e;

        .fileTreeBox {
          background-color: #262a2e;

          /deep/ .el-tree {
            background-color: #262a2e;

            &.el-tree--highlight-current {
              .el-tree-node.is-current > .el-tree-node__content {
                background-color: hsla(0, 0%, 100%, 0.05) !important;
              }
            }

            .el-tree-node:focus > .el-tree-node__content {
              background-color: hsla(0, 0%, 100%, 0.05) !important;
            }

            .el-tree-node__content:hover,
            .el-upload-list__item:hover {
              background-color: hsla(0, 0%, 100%, 0.02) !important;
            }
          }

          .fileTreeWrap {
            .customTreeNode {
              .treeNodeInfo {
                color: #fff;
              }

              .treeNodeBtnList {
                .el-button {
                  padding: 7px 5px;
                }
              }
            }
          }
        }
      }

      .toolbarBtn {
        .icon {
          background: transparent;
          border-color: transparent;
        }

        &:hover {
          &:not(.disabled) {
            .icon {
              background: hsla(0, 0%, 100%, 0.05);
            }
          }
        }

        &.disabled {
          color: #54595f;
        }
      }
    }
  }
  .toolbar {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    top: 20px;
    width: max-content;
    display: flex;
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: rgba(26, 26, 26, 0.8);
    z-index: 2;

    .toolbarBlock {
      display: flex;
      background-color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.06);
      margin-right: 20px;
      flex-shrink: 0;
      position: relative;

      &:last-of-type {
        margin-right: 0;
      }

      .fileTreeBox {
        position: absolute;
        left: 0;
        top: 68px;
        width: 100%;
        height: 30px;
        background-color: #fff;
        padding: 12px 5px;
        padding-top: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 5px;
        min-width: 200px;
        box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);

        &.expand {
          height: 300px;

          .fileTreeWrap {
            visibility: visible;
          }
        }

        .fileTreeToolbar {
          width: 100%;
          height: 30px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e9e9e9;
          margin-bottom: 12px;
          padding-left: 12px;

          .fileTreeName {
          }

          .fileTreeActionList {
            .btn {
              font-size: 18px;
              margin-left: 12px;
              cursor: pointer;
            }
          }
        }

        .fileTreeWrap {
          width: 100%;
          height: 100%;
          overflow: auto;
          visibility: hidden;

          .customTreeNode {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            padding-right: 5px;

            .treeNodeInfo {
              display: flex;
              align-items: center;

              .treeNodeIcon {
                margin-right: 5px;
                opacity: 0.7;
              }

              .treeNodeName {
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .treeNodeBtnList {
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }

    .toolbarBtn {
      display: flex;
      justify-content: center;
      flex-direction: column;
      cursor: pointer;
      margin-right: 20px;

      &:last-of-type {
        margin-right: 0;
      }

      &:hover {
        &:not(.disabled) {
          .icon {
            background: #f5f5f5;
          }
        }
      }

      &.active {
        .icon {
          background: #f5f5f5;
        }
      }

      &.disabled {
        color: #bcbcbc;
        cursor: not-allowed;
        pointer-events: none;
      }

      .icon {
        display: flex;
        height: 26px;
        background: #fff;
        border-radius: 4px;
        border: 1px solid #e9e9e9;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        padding: 0 5px;
      }

      .text {
        margin-top: 3px;
      }
    }
  }
}
</style>
