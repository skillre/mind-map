<template>
  <div class="github-file-manager">
    <div class="header">
      <el-button type="primary" size="small" @click="handleNewFile">
        <i class="el-icon-plus"></i>
        {{ $t('github.newFile') }}
      </el-button>
      <el-button size="small" @click="handleRefresh">
        <i class="el-icon-refresh"></i>
        {{ $t('common.refresh') }}
      </el-button>
    </div>
    
    <div class="file-list" v-loading="loading">
      <div v-if="fileList.length === 0" class="empty">
        <i class="el-icon-folder-opened"></i>
        <p>{{ $t('github.noFiles') }}</p>
      </div>
      
      <div
        v-for="file in fileList"
        :key="file.name"
        class="file-item"
        :class="{ active: file.name === currentFile }"
        @click="handleSelectFile(file)"
      >
        <i class="el-icon-document"></i>
        <span class="file-name" :title="file.name">{{ file.name }}</span>
        <span class="file-time">{{ formatTime(file.lastModified) }}</span>
        <div class="file-actions">
          <el-button
            type="text"
            size="mini"
            @click.stop="handleDeleteFile(file)"
          >
            <i class="el-icon-delete"></i>
          </el-button>
        </div>
      </div>
    </div>
    
    <el-dialog
      :title="$t('github.saveFile')"
      :visible.sync="saveDialogVisible"
      width="400px"
    >
      <el-form>
        <el-form-item :label="$t('github.fileName')">
          <el-input
            v-model="saveFileName"
            :placeholder="$t('github.fileNamePlaceholder')"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="saveDialogVisible = false">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button type="primary" @click="handleSaveFile">
          {{ $t('common.confirm') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getGitHubFileList, loadGitHubFile, saveToGitHub, deleteGitHubFile, getCurrentFileName } from '@/api'

export default {
  name: 'GitHubFileManager',
  props: {
    mindMap: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      fileList: [],
      loading: false,
      saveDialogVisible: false,
      saveFileName: '',
      currentFile: ''
    }
  },
  mounted() {
    this.loadFiles()
    this.currentFile = getCurrentFileName()
  },
  methods: {
    async loadFiles() {
      this.loading = true
      try {
        this.fileList = await getGitHubFileList()
      } catch (error) {
        this.$message.error(this.$t('github.loadFilesError'))
      } finally {
        this.loading = false
      }
    },
    
    handleRefresh() {
      this.loadFiles()
    },
    
    async handleSelectFile(file) {
      try {
        const data = await loadGitHubFile(file.name)
        if (this.mindMap && data) {
          this.mindMap.setData(data)
          this.$message.success(this.$t('github.fileLoaded'))
        }
        this.currentFile = file.name
        this.$emit('file-selected', file.name)
      } catch (error) {
        this.$message.error(this.$t('github.loadFileError'))
      }
    },
    
    handleNewFile() {
      if (this.mindMap) {
        this.mindMap.clear()
        this.currentFile = 'untitled.smm'
        this.$emit('file-selected', 'untitled.smm')
      }
    },
    
    handleSave() {
      this.saveFileName = this.currentFile || 'untitled.smm'
      this.saveDialogVisible = true
    },
    
    async handleSaveFile() {
      if (!this.saveFileName.trim()) {
        this.$message.warning(this.$t('github.fileNameRequired'))
        return
      }
      
      if (!this.saveFileName.endsWith('.smm')) {
        this.saveFileName += '.smm'
      }
      
      try {
        const data = this.mindMap.getData(true)
        await saveToGitHub(this.saveFileName, data)
        this.currentFile = this.saveFileName
        this.$message.success(this.$t('github.fileSaved'))
        this.saveDialogVisible = false
        await this.loadFiles()
        this.$emit('file-saved', this.saveFileName)
      } catch (error) {
        this.$message.error(this.$t('github.saveFileError'))
      }
    },
    
    async handleDeleteFile(file) {
      try {
        await this.$confirm(
          this.$t('github.deleteConfirm', { name: file.name }),
          this.$t('common.warning'),
          { type: 'warning' }
        )
        
        await deleteGitHubFile(file.name)
        this.$message.success(this.$t('github.fileDeleted'))
        
        if (file.name === this.currentFile) {
          this.currentFile = ''
          this.$emit('file-deleted')
        }
        
        await this.loadFiles()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(this.$t('github.deleteFileError'))
        }
      }
    },
    
    formatTime(time) {
      if (!time) return ''
      return new Date(time).toLocaleString()
    }
  }
}
</script>

<style scoped>
.github-file-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 10px;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.empty {
  text-align: center;
  color: #909399;
  padding: 40px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 5px;
}

.file-item:hover {
  background-color: #f5f7fa;
}

.file-item.active {
  background-color: #ecf5ff;
}

.file-name {
  flex: 1;
  margin-left: 8px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-time {
  font-size: 12px;
  color: #909399;
  margin-right: 8px;
}

.file-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.file-item:hover .file-actions {
  opacity: 1;
}
</style>