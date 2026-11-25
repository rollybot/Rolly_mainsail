<template>
  <v-container fluid class="rollybot-monitoring-container">
    <!-- 상단 타이틀 섹션 -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold primary--text mb-2">Rollybot Monitoring</h1>
        <p class="text-subtitle-1 text--secondary">[ Delta Square 프린터 모니터링 및 공지사항 전달 ]</p>
      </v-col>
    </v-row>

    <!-- 공지 문구 입력 섹션 -->
    <v-card class="mb-6 elevation-2" outlined>
      <v-card-title class="headline font-weight-bold">
        <v-icon left color="primary">mdi-bullhorn</v-icon>
        공지 문구 (전체 공통)
      </v-card-title>
      <v-card-text>
        <p class="text-caption text--secondary mb-2">
          ※ 최대 5줄까지 입력할 수 있습니다. 줄바꿈은 Enter로 입력합니다. 작은따옴표(')와 큰따옴표(")는 ' ”로, 세미콜론(;)은 쉼표로 바뀌어 저장됩니다.
        </p>
        <v-textarea
          v-model="noticeText"
          outlined
          rows="5"
          placeholder="여기에 공지할 문구를 입력하세요."
          hide-details
          class="mb-4"
        ></v-textarea>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-btn color="primary" class="font-weight-bold" @click="applyNotice">선택한 프린터에 적용</v-btn>
        <v-btn color="error" text @click="clearNotice">문구 지우기(전체)</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="secondary" outlined @click="refreshStatus">지금 새로고침</v-btn>
        <v-checkbox
          v-model="autoRefresh"
          label="20초마다 자동 갱신"
          hide-details
          class="ml-4 mt-0 pt-0"
        ></v-checkbox>
      </v-card-actions>
    </v-card>

    <!-- 프린터 목록 및 모니터링 테이블 섹션 -->
    <v-card class="elevation-2" outlined>
      <v-card-title class="headline font-weight-bold d-flex align-center">
        <v-icon left color="primary">mdi-printer-3d</v-icon>
        프린터 목록
        <v-spacer></v-spacer>
        <v-btn small color="primary" outlined class="mr-2" @click="addPrinter">
          <v-icon left small>mdi-plus</v-icon>프린터 추가
        </v-btn>
        <v-btn small color="error" outlined @click="deleteSelectedPrinters">
          <v-icon left small>mdi-delete</v-icon>선택 삭제
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <p class="text-caption text--secondary mb-4">
          ※ 주소(IP)만 입력하면 됩니다. 프린터 이름은 연결되면 자동으로 가져와 표시되며 편집할 수 없습니다. 포트가 다르면 192.168.0.11:7125 처럼 적으세요. 이 목록은 이 브라우저에 저장됩니다.
        </p>

        <!-- 데이터 테이블 -->
        <v-simple-table>
          <template #default>
            <thead>
              <tr>
                <th class="text-left" style="width: 50px;">선택</th>
                <th class="text-left">순번</th>
                <th class="text-left">주소(IP)</th>
                <th class="text-left">프린터</th>
                <th class="text-left">출력 상태</th>
                <th class="text-left">온도</th>
                <th class="text-left">현재 공지</th>
                <th class="text-left">공지 동기화</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(printer, index) in printers" :key="index">
                <td>
                  <v-checkbox v-model="printer.selected" hide-details class="mt-0 pt-0"></v-checkbox>
                </td>
                <td>프린터{{ index + 1 }}</td>
                <td>
                  <v-text-field
                    v-model="printer.ip"
                    dense
                    outlined
                    hide-details
                    placeholder="192.168.0.X"
                    @blur="savePrinterList"
                  ></v-text-field>
                </td>
                <td>{{ printer.name || '연결 대기중...' }}</td>
                <td>
                  <v-chip :color="getStatusColor(printer.status)" small dark>
                    {{ printer.status || 'Offline' }}
                  </v-chip>
                </td>
                <td>{{ printer.temperature || '-' }} °C</td>
                <td>{{ printer.currentNotice || '-' }}</td>
                <td>
                  <v-icon :color="printer.synced ? 'success' : 'warning'">
                    {{ printer.synced ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-card-text>
      
      <v-card-actions class="px-4 pb-4">
        <v-btn color="success" class="font-weight-bold" @click="savePrinterList">저장</v-btn>
        <v-btn text @click="loadPrinterList">취소</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="indigo" dark @click="openZipDialog">
          <v-icon left>mdi-zip-box</v-icon>zip 파일 올리기…
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Zip 파일 업로드 모달 팝업 -->
    <v-dialog v-model="zipDialog" max-width="600px">
      <v-card>
        <v-card-title class="headline font-weight-bold">
          <v-icon left color="indigo">mdi-cloud-upload</v-icon>
          zip 파일 올리기
        </v-card-title>
        <v-card-text class="pt-2">
          <p class="text-body-2 mb-4">
            선택한 zip 파일을, 위 표에서 체크한 프린터의 config 폴더에 올립니다. (Mainsail의 Machine 탭에서 올리는 것과 같은 방식입니다.)
          </p>
          <v-alert type="info" text dense class="text-caption">
            zip 안의 첫 폴더가 pi이고, 그 아래 구조가 프린터의 /home/pi 아래 경로와 같아야 합니다. 올리기가 끝나면 관리자가 PuTTY로 각 프린터에 접속해 안내되는 명령으로 압축을 풉니다. 백업은 하지 않으며, 기존 파일은 새 파일로 바뀝니다.
          </v-alert>
          <v-file-input
            v-model="zipFile"
            label="올릴 zip 파일 선택 (예: pi.zip)"
            outlined
            dense
            accept=".zip"
            prepend-icon="mdi-paperclip"
          ></v-file-input>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeZipDialog">닫기</v-btn>
          <v-btn color="indigo" dark class="font-weight-bold" @click="uploadZipFile">
            선택한 프린터에 zip 올리기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'

interface PrinterItem {
  selected: boolean;
  ip: string;
  name: string;
  status: string;
  temperature: string;
  currentNotice: string;
  synced: boolean;
}

export default defineComponent({
  name: 'NoticeView',
  setup() {
    const noticeText = ref('')
    const autoRefresh = ref(true)
    const zipDialog = ref(false)
    const zipFile = ref<File | null>(null)
    const printers = ref<PrinterItem[]>([])
    let refreshInterval: number | null = null

    // 로컬 스토리지에서 프린터 목록 로드
    const loadPrinterList = () => {
      const saved = localStorage.getItem('rollybot_printers')
      if (saved) {
        printers.value = JSON.parse(saved)
      } else {
        // 기본 빈 줄 추가
        printers.value = [{ selected: false, ip: '', name: '', status: '', temperature: '', currentNotice: '', synced: false }]
      }
    }

    // 로컬 스토리지에 프린터 목록 저장
    const savePrinterList = () => {
      // 주소가 비어있는 항목은 저장할 때 제외하는 필터 로직 추가 가능
      const filtered = printers.value.filter(p => p.ip.trim() !== '')
      localStorage.setItem('rollybot_printers', JSON.stringify(printers.value))
      alert('프린터 목록이 브라우저에 저장되었습니다.')
    }

    const addPrinter = () => {
      printers.value.push({
        selected: false,
        ip: '',
        name: '',
        status: '',
        temperature: '',
        currentNotice: '',
        synced: false
      })
    }

    const deleteSelectedPrinters = () => {
      printers.value = printers.value.filter(p => !p.selected)
      if (printers.value.length === 0) addPrinter()
      localStorage.setItem('rollybot_printers', JSON.stringify(printers.value))
    }

    // 특수문자 변환 로직이 포함된 공지 적용 함수
    const applyNotice = () => {
      if (!noticeText.value) return
      
      // 기획서 규칙: 따옴표 및 세미콜론 치환
      const processedText = noticeText.value
        .replace(/'/g, '’')
        .replace(/"/g, '”')
        .replace(/;/g, ',');
      
      noticeText.value = processedText

      // TODO: 체크된 프린터들을 대상으로 Moonraker API 통신을 통해 파일 저장/명령 전달 수행
      alert('선택된 프린터에 공지 적용을 시작합니다.')
    }

    const clearNotice = () => {
      noticeText.value = ''
    }

    const refreshStatus = () => {
      // TODO: 각 프린터 IP의 Moonraker API(/printer/objects/query)를 호출하여 온도 및 상태 갱신
      console.log('프린터 상태 새로고침 실행')
    }

    const getStatusColor = (status: string) => {
      if (status === 'Printing') return 'success'
      if (status === 'Ready') return 'info'
      if (status === 'Error') return 'error'
      return 'grey'
    }

    const openZipDialog = () => { zipDialog.value = true }
    const closeZipDialog = () => { zipDialog.value = false; zipFile.value = null; }
    
    const uploadZipFile = () => {
      if (!zipFile.value) {
        alert('올릴 zip 파일을 선택해 주세요.')
        return
      }
      // TODO: Moonraker API(/server/files/upload)를 이용하여 파일 업로드 수행
      alert('선택한 프린터들로 zip 파일 업로드를 요청했습니다.')
      closeZipDialog()
    }

    onMounted(() => {
      loadPrinterList()
      // 20초 자동 갱신 타이머 등록
      refreshInterval = window.setInterval(() => {
        if (autoRefresh.value) {
          refreshStatus()
        }
      }, 20000)
    })

    onBeforeUnmount(() => {
      if (refreshInterval) clearInterval(refreshInterval)
    })

    return {
      noticeText,
      autoRefresh,
      zipDialog,
      zipFile,
      printers,
      addPrinter,
      deleteSelectedPrinters,
      applyNotice,
      clearNotice,
      refreshStatus,
      savePrinterList,
      loadPrinterList,
      getStatusColor,
      openZipDialog,
      closeZipDialog,
      uploadZipFile
    }
  }
})
</script>

<style scoped>
.rollybot-monitoring-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
