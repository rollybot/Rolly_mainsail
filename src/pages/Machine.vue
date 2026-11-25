<template>
    <v-container fluid py-0 px-0 class="grey--text text--lighten-1">
        <!-- 1. 관리자 인증이 완료된 경우에만 UI 노출 -->
        <v-row v-if="isAuthenticated">
            <!-- 로그아웃 버튼 영역 (인증 성공 시 우측 상단에 고정 표시) -->
            <v-col cols="12" class="d-flex justify-end pb-0">
                <v-btn color="error" text small @click="handleLogout">
                    <v-icon left small>mdi-logout</v-icon>
                    로그아웃
                </v-btn>
            </v-col>

            <!-- 좌측 영역: Config Files Panel 복구 -->
            <v-col class="col-12 col-md-6 pb-0 pb-md-3">
                <config-files-panel></config-files-panel>
            </v-col>
            
            <!-- 우측 영역: 기존 패널들 및 Update Panel 복구 -->
            <v-col class="col-12 col-md-6 pt-0 pt-md-3">
                <klippy-state-panel></klippy-state-panel>
                <system-panel></system-panel>
                <update-panel></update-panel>
                
                <v-row>
                    <v-col v-if="klipperState === 'ready'" class="col-12 col-sm-6 pb-0 pb-md-3">
                        <endstop-panel></endstop-panel>
                    </v-col>
                    <v-col :class="klipperState !== 'ready' ? 'col-12' : 'col-12 col-sm-6 pt-0 pt-sm-3'">
                        <logfiles-panel></logfiles-panel>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>

        <!-- 2. 비밀번호 입력 팝업 창 (모달 구조) -->
        <v-dialog v-model="showPasswordDialog" persistent max-width="400px">
            <v-card class="pa-4">
                <v-card-title class="text-h5 justify-center pb-2">
                    <v-icon left color="warning" class="mr-2">mdi-lock</v-icon>
                    관리자 인증
                </v-card-title>
                <v-card-text class="pt-4">
                    <v-text-field
                        v-model="passwordInput"
                        label="비밀번호를 입력하세요"
                        type="password"
                        outlined
                        dense
                        hide-details
                        @keyup.enter="verifyPassword"
                    ></v-text-field>
                    <p v-if="isPasswordError" class="red--text text-caption mt-2 mb-0 text-center">
                        비밀번호가 올바르지 않습니다.
                    </p>
                </v-card-text>
                <v-card-actions class="justify-center">
                    <v-btn color="primary" class="px-6" @click="verifyPassword">확인</v-btn>
                    <v-btn color="grey" text class="px-6" @click="cancelAccess">취소</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import KlippyStatePanel from '@/components/panels/KlippyStatePanel.vue'
import UpdatePanel from '@/components/panels/Machine/UpdatePanel.vue'
import LogfilesPanel from '@/components/panels/Machine/LogfilesPanel.vue'
import EndstopPanel from '@/components/panels/Machine/EndstopPanel.vue'
import ConfigFilesPanel from '@/components/panels/Machine/ConfigFilesPanel.vue'
import SystemPanel from '@/components/panels/Machine/SystemPanel.vue'

@Component({
    components: {
        SystemPanel,
        ConfigFilesPanel,
        EndstopPanel,
        LogfilesPanel,
        UpdatePanel,
        KlippyStatePanel,
    },
})
export default class PageMachine extends Mixins(BaseMixin) {
    // 🔒 비밀번호 설정 (원하는 영문/숫자 비밀번호를 입력하세요)
    private adminPassword = 'admin'

    // 상태 관리 변수들
    private isAuthenticated = false
    private showPasswordDialog = false
    private passwordInput = ''
    private isPasswordError = false

    // 컴포넌트가 로드될 때 실행 (인증 여부 확인)
    mounted() {
        const sessionAuth = sessionStorage.getItem('machine_authenticated')
        if (sessionAuth === 'true') {
            this.isAuthenticated = true
        } else {
            this.showPasswordDialog = true
        }
    }

    // 비밀번호 검증 함수
    private verifyPassword() {
        if (this.passwordInput === this.adminPassword) {
            this.isAuthenticated = true
            this.showPasswordDialog = false
            this.isPasswordError = false
            sessionStorage.setItem('machine_authenticated', 'true') // 세션에 인증 상태 저장
        } else {
            this.isPasswordError = true
            this.passwordInput = ''
        }
    }

    // 취소 버튼 클릭 시 메인 대시보드로 이동
    private cancelAccess() {
        this.showPasswordDialog = false
        this.$router.push('/')
    }

    // 🔓 로그아웃 실행 함수 (대시보드로 튕겨내기 추가)
    private handleLogout() {
        this.isAuthenticated = false
        this.passwordInput = ''
        sessionStorage.removeItem('machine_authenticated') // 인증 토큰 삭제
        
        // 1. 상태를 초기화하여 인증 창을 기본값으로 준비
        this.showPasswordDialog = true 
        
        // 2. 즉시 대시보드(홈) 화면으로 이동시킵니다
        this.$router.push('/')
    }

}
</script>
