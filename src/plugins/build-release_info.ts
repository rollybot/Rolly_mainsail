import fs from 'fs'
import path from 'path'
import pkg from '../../package.json' with { type: 'json' }
import type { PluginOption } from 'vite'

/**
 * Custom build plugin to write the version in a dedicated release_info.json file after bundling
 */

export default function buildReleaseInfo(): PluginOption {
    // 릴리스 태그(v2.19.2 등)가 있으면 그 값을, 없으면 package.json 버전을 사용
    const tag = process.env.GITHUB_REF_NAME
    const version = tag && /^v\d/.test(tag) ? tag.replace(/^v/, '') : pkg.version

    return {
        name: 'build-release_info',
        writeBundle: () => {
            setImmediate(async () => {
                const releaseInfoFile = await fs.promises.open(
                    path.resolve(import.meta.dirname, '../../dist/release_info.json'),
                    'w'
                )
                await releaseInfoFile.writeFile(
                    JSON.stringify({
                        project_name: 'Rolly_mainsail',
                        project_owner: 'rollybot',
                        version: `v${version}`,
                    })
                )
                await releaseInfoFile.close()
            })
        },
    }
}
