import * as core from '@actions/core'

import { getToken } from './api/authApi'
import {
  checkTaskStatus,
  getEnterpriseAppVersions,
  getProfileId,
  publishEnterpriseAppVersion,
  uploadEnterpriseApp,
  UploadServiceHeaders
} from './api/uploadApi'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const accessToken = core.getInput('accessToken')
    const entProfileId = core.getInput('entProfileId')
    const appPath = core.getInput('appPath')
    const summary = core.getInput('summary')
    const releaseNotes = core.getInput('releaseNotes')
    const publishType = core.getInput('publishType') ?? '0'

    const loginResponse = await getToken(accessToken)
    UploadServiceHeaders.token = loginResponse.access_token
    console.log('Logged in to Appcircle successfully')

    const uploadResponse = await uploadEnterpriseApp(appPath)
    console.log('uploadResponse', uploadResponse)
    const status = await checkTaskStatus(uploadResponse.taskId)

    if (!status) {
      core.setFailed(
        `${uploadResponse.taskId} id upload request failed with status Cancelled`
      )
      return
    }

    if (publishType !== '0') {
      const profileId = await getProfileId()
      const appVersions = await getEnterpriseAppVersions({
        entProfileId: profileId
      })
      console.log('profileId:', profileId)
      console.log('versions: ', appVersions)
      const entVersionId = appVersions[0].id
      console.log('entVersionId:', entVersionId)
      // await publishEnterpriseAppVersion({
      //   entProfileId: profileId,
      //   entVersionId
      // })
    }

    console.log(
      `${appPath} uploaded to the Appcircle Enterprise Store successfully`
    )

    /*I need to get back a profile id for newly created profiles because i do not know which is the profile for publishment after uploading */

    // const command = `appcircle enterprise-app-store version upload-for-profile --entProfileId ${entProfileId} --app ${appPath} -o json`
    // const output = execSync(command, { encoding: 'utf-8' })
    // const list = JSON.parse(output)

    // await checkTaskStatus(list?.taskId)

    // const versionCommand = `appcircle enterprise-app-store version list --entProfileId ${entProfileId}  -o json`
    // const versions = execSync(versionCommand, { encoding: 'utf-8' })
    // const latestPublishedAppId = JSON.parse(versions)?.[0]?.id
    // execSync(
    //   `appcircle enterprise-app-store version publish --entProfileId ${entProfileId} --entVersionId ${latestPublishedAppId} --summary "${summary}" --releaseNotes "${releaseNotes}" --publishType ${publishType}`,
    //   { encoding: 'utf-8' }
    // )
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}
