<template>
  <el-dialog
    :title="$t('github.title')"
    :visible.sync="visible"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="configForm"
      :model="config"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item :label="$t('github.owner')" prop="owner">
        <el-input v-model="config.owner" :placeholder="$t('github.ownerPlaceholder')" />
      </el-form-item>
      
      <el-form-item :label="$t('github.repo')" prop="repo">
        <el-input v-model="config.repo" :placeholder="$t('github.repoPlaceholder')" />
      </el-form-item>
      
      <el-form-item :label="$t('github.token')" prop="token">
        <el-input
          v-model="config.token"
          type="password"
          :placeholder="$t('github.tokenPlaceholder')"
          show-password
        />
        <div class="tip">{{ $t('github.tokenTip') }}</div>
      </el-form-item>
      
      <el-form-item :label="$t('github.branch')" prop="branch">
        <el-input v-model="config.branch" :placeholder="$t('github.branchPlaceholder')" />
      </el-form-item>
      
      <el-form-item :label="$t('github.path')" prop="path">
        <el-input v-model="config.path" :placeholder="$t('github.pathPlaceholder')" />
      </el-form-item>
      
      <el-form-item :label="$t('github.autoSave')">
        <el-switch v-model="config.enableAutoSave" />
      </el-form-item>
    </el-form>
    
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">{{ $t('common.confirm') }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { initGitHubStorage, saveGitHubConfig, getGitHubConfig } from '@/api'

export default {
  name: 'GitHubConfigDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      config: {
        owner: '',
        repo: '',
        token: '',
        branch: 'main',
        path: 'mind-maps',
        enableAutoSave: true
      },
      rules: {
        owner: [
          { required: true, message: this.$t('github.ownerRequired'), trigger: 'blur' }
        ],
        repo: [
          { required: true, message: this.$t('github.repoRequired'), trigger: 'blur' }
        ],
        token: [
          { required: true, message: this.$t('github.tokenRequired'), trigger: 'blur' }
        ],
        branch: [
          { required: true, message: this.$t('github.branchRequired'), trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    visible: {
      get() {
        return this.show
      },
      set(val) {
        this.$emit('update:show', val)
      }
    }
  },
  mounted() {
    this.loadConfig()
  },
  methods: {
    loadConfig() {
      const savedConfig = getGitHubConfig()
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig }
      }
    },
    handleSave() {
      this.$refs.configForm.validate(valid => {
        if (valid) {
          initGitHubStorage(this.config)
          saveGitHubConfig(this.config)
          this.$message.success(this.$t('github.configSaved'))
          this.$emit('saved', this.config)
          this.visible = false
        }
      })
    },
    handleClose() {
      this.visible = false
    }
  }
}
</script>

<style scoped>
.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>