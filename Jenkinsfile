import groovy.json.JsonOutput

def APP_NAME = 'signing-web'
def CADDY_BUILD_CONFIG = "${APP_NAME}-caddy"
def CADDY_IMAGESTREAM_NAME = "${APP_NAME}-caddy"
def TAG_NAMES = ['dev', 'test', 'prod']
def PIRATE_ICO = 'http://icons.iconarchive.com/icons/aha-soft/torrent/64/pirate-icon.png'
def JENKINS_ICO = 'https://wiki.jenkins-ci.org/download/attachments/2916393/logo.png'
def OPENSHIFT_ICO = 'https://commons.wikimedia.org/wiki/File:OpenShift-LogoType.svg'
def SLACK_CHANNEL = '#devhubx'
def POD_LABEL = "${APP_NAME}-${UUID.randomUUID().toString()}"

def notifySlack(text, channel, url, attachments, icon) {
    def slackURL = url
    def jenkinsIcon = icon
    def payload = JsonOutput.toJson([text: text,
        channel: channel,
        username: "Jenkins",
        icon_url: jenkinsIcon,
        attachments: attachments
    ])
    sh "curl -s -S -X POST --data-urlencode \'payload=${payload}\' ${slackURL}"
}

// See https://github.com/jenkinsci/kubernetes-plugin
podTemplate(label: "${POD_LABEL}", name: "${POD_LABEL}", serviceAccount: 'jenkins', cloud: 'openshift', containers: [
  containerTemplate(
    name: 'jnlp',
    image: 'docker-registry.default.svc:5000/openshift/jenkins-slave-nodejs:8',
    resourceRequestCpu: '500m',
    resourceLimitCpu: '1000m',
    resourceRequestMemory: '1Gi',
    resourceLimitMemory: '2Gi',
    workingDir: '/tmp',
    command: '',
    args: '${computer.jnlpmac} ${computer.name}',
    alwaysPullImage: false
    // envVars: [
    //     secretEnvVar(key: 'BDD_DEVICE_FARM_USER', secretName: 'bdd-credentials', secretKey: 'username'),
    //     secretEnvVar(key: 'BDD_DEVICE_FARM_PASSWD', secretName: 'bdd-credentials', secretKey: 'password'),
    //     secretEnvVar(key: 'ANDROID_DECRYPT_KEY', secretName: 'android-decrypt-key', secretKey: 'decryptKey')
    //   ]
  )
])
{
  node("${POD_LABEL}") {
    stage('Checkout') {
      echo "Checking out source"
      checkout scm

      GIT_COMMIT_SHORT_HASH = sh (
        script: """git describe --always""",
        returnStdout: true).trim()
      GIT_COMMIT_AUTHOR = sh (
        script: """git show -s --pretty=%an""",
        returnStdout: true).trim()
      GIT_BRANCH_NAME = sh (
        script: """git branch -a -v --no-abbrev --contains ${GIT_COMMIT_SHORT_HASH} | \
        grep 'remotes' | \
        awk -F ' ' '{print \$1}' | \
        awk -F '/' '{print \$3}'""",
        returnStdout: true).trim()
      echo "I think my branch is ${GIT_BRANCH_NAME}"

      SLACK_TOKEN = sh (
        script: """oc get secret/slack -o template --template="{{.data.token}}" | base64 --decode""",
        returnStdout: true).trim()
    }
    
    stage('Install') {
      echo "Setup: ${BUILD_ID}"

      // install packages
      sh "npm ci"

      // not sure if this needs to be added to package.json.
      // sh "npm i escape-string-regexp"
      sh "npm -v"
      sh "node -v"
    }

    stage('Test') {
      echo "Testing: ${BUILD_ID}"

      //
      // Check the code builds
      //

      try {
        echo "Checking Build"
        sh "SKIP_PREFLIGHT_CHECK=true npm run build" //TODO: ignore the react-scripts issue for now. Please remove SKIP_PREFLIGHT_CHECK after major version update
      } catch (error) {
        def attachment = [:]
        attachment.fallback = 'See build log for more details'
        attachment.title = "Web Build ${BUILD_ID} FAILED! :face_with_head_bandage: :hankey:"
        attachment.color = '#CD0000' // Red
        attachment.text = "The code does not build.\ncommit ${GIT_COMMIT_SHORT_HASH} by ${GIT_COMMIT_AUTHOR}"
        // attachment.title_link = "${env.BUILD_URL}"

        // notifySlack("${APP_NAME}, Build #${BUILD_ID}", "${SLACK_CHANNEL}", "https://hooks.slack.com/services/${SLACK_TOKEN}", [attachment], JENKINS_ICO)
        sh "exit 1001"
      }

      //
      // Check code quality
      //

      try {
        echo "Checking code quality with SonarQube"
        SONARQUBE_URL = sh (
            script: 'oc get routes -o wide --no-headers | awk \'/sonarqube/{ print match($0,/edge/) ?  "https://"$2 : "http://"$2 }\'',
            returnStdout: true
              ).trim()
        echo "SONARQUBE_URL: ${SONARQUBE_URL}"
        dir('sonar-runner') {
          sh returnStdout: true, script: "./gradlew sonarqube -Dsonar.verbose=true"
        }
        // TODO: update parameters
          // -Dsonar.host.url=${SONARQUBE_URL} 
          // -Dsonar.verbose=true --stacktrace --info -Dsonar.projectName=${APP_NAME} 
          // -Dsonar.branch=${GIT_BRANCH_NAME} -Dsonar.projectKey=org.sonarqube:${APP_NAME} 
          // -Dsonar.sources=src/ -Dsonar.tests=src/ -Dsonar.testExecutionReportPaths=src/tests-report-fake.xml"
        // }
      } catch (error) {
        def attachment = [:]
        attachment.fallback = 'See build log for more details'
        attachment.title = "Web Build ${BUILD_ID} WARNING! :unamused: :zany_face: :facepalm:"
        attachment.color = '#FFA500' // Orange
        attachment.text = "The SonarQube code quality check failed. look at ${SONARQUBE_URL} \ncommit ${GIT_COMMIT_SHORT_HASH} by ${GIT_COMMIT_AUTHOR}"
        // attachment.title_link = "${env.BUILD_URL}"

        notifySlack("${APP_NAME}, Build #${BUILD_ID}", "${SLACK_CHANNEL}", "https://hooks.slack.com/services/${SLACK_TOKEN}", [attachment], JENKINS_ICO)
      }
      
      //
      // Check code quality with a LINTer
      //

      try {
        echo "Checking code quality with LINTer"
        sh "npx eslint --ext .js,.jsx src"
      } catch (error) {
        def attachment = [:]
        attachment.fallback = 'See build log for more details'
        attachment.title = "Web Build ${BUILD_ID} WARNING! :unamused: :zany_face: :facepalm:"
        attachment.color = '#FFA500' // Orange
        attachment.text = "There LINTer code quality check failed.\ncommit ${GIT_COMMIT_SHORT_HASH} by ${GIT_COMMIT_AUTHOR}"
        // attachment.title_link = "${env.BUILD_URL}"

        // notifySlack("${APP_NAME}, Build #${BUILD_ID}", "${SLACK_CHANNEL}", "https://hooks.slack.com/services/${SLACK_TOKEN}", [attachment], JENKINS_ICO)
      }

      //
      // Run a security check on our packages
      //

      // NSP is shutting down. Replace with `npm audit`

      //
      // Run our unit tests et al.
      //
      // TODO: add unit testing
      // try {
      //   // Run our unit tests et al.
      //   sh "CI=true SKIP_PREFLIGHT_CHECK=true npm test"
      // } catch (error) {
      //   def attachment = [:]
      //   attachment.fallback = 'See build log for more details'
      //   attachment.title = "Web Build ${BUILD_ID} Failed :hankey: :face_with_head_bandage:"
      //   attachment.color = '#CD0000' // Red
      //   attachment.text = "There are issues with the unit tests.\ncommit ${GIT_COMMIT_SHORT_HASH} by ${GIT_COMMIT_AUTHOR}"
      //   // attachment.title_link = "${env.BUILD_URL}"

      //   notifySlack("${APP_NAME}, Build #${BUILD_ID}", "${SLACK_CHANNEL}", "https://hooks.slack.com/services/${SLACK_TOKEN}", [attachment], JENKINS_ICO)
      //   sh "exit 1002"
      // }
    }

    stage('Build Image') {
      echo "Build: ${BUILD_ID}"
      // run the oc build to package the artifacts into a docker image
      // TODO: refering to the existing build configs:
      // openshiftBuild bldCfg: "${APP_NAME}-${GIT_BRANCH_NAME}-build", showBuildLogs: 'true', verbose: 'true'
      // openshiftBuild bldCfg: "${CADDY_BUILD_CONFIG}-${GIT_BRANCH_NAME}-build", showBuildLogs: 'true', verbose: 'true'
      
      openshiftBuild bldCfg: "${APP_NAME}-master-build", showBuildLogs: 'true', verbose: 'true'
      openshiftBuild bldCfg: "${CADDY_BUILD_CONFIG}-master-build", showBuildLogs: 'true', verbose: 'true'

      // Don't tag with BUILD_ID so the pruner can do it's job; it won't delete tagged images.
      // Tag the images for deployment based on the image's hash
      IMAGE_HASH = sh (
        script: """oc get istag ${CADDY_IMAGESTREAM_NAME}:latest -o template --template=\"{{.image.dockerImageReference}}\"|awk -F \":\" \'{print \$3}\'""",
        returnStdout: true).trim()
      echo ">> IMAGE_HASH: ${IMAGE_HASH}"

      openshiftTag destStream: CADDY_IMAGESTREAM_NAME, verbose: 'true', destTag: TAG_NAMES[0], srcStream: CADDY_IMAGESTREAM_NAME, srcTag: "${IMAGE_HASH}"

      try {
        def attachment = [:]
        attachment.fallback = 'See build log for more details'
        attachment.text = "Another huge success for the Signing Web Team.\n A freshly minted build is being deployed. You should see the results shortly.\ncommit ${GIT_COMMIT_SHORT_HASH} by ${GIT_COMMIT_AUTHOR}"
        attachment.title = "WEB Build ${BUILD_ID} OK! :raised_hands: :clap: woot!"
        attachment.color = '#00FF00' // Lime Green

        notifySlack("${APP_NAME}", "${SLACK_CHANNEL}", "https://hooks.slack.com/services/${SLACK_TOKEN}", [attachment], JENKINS_ICO)
      } catch (error) {
        echo "Unable send update to slack, error = ${error}"
      }
    }

    // stage('Approval') {
    //   timeout(time: 1, unit: 'DAYS') {
    //     input message: "Deploy to test?", submitter: 'authenticated'
    //   }
    //   node ('master') {
    //     stage('Promotion') {
    //       openshiftTag destStream: CADDY_IMAGESTREAM_NAME, verbose: 'true', destTag: TAG_NAMES[1], srcStream: CADDY_IMAGESTREAM_NAME, srcTag: "${IMAGE_HASH}"
    //       notifySlack("Promotion Completed\n Build #${BUILD_ID} was promoted to test.", "#range-web-caddy", "https://hooks.slack.com/services/${SLACK_TOKEN}", [], OPENSHIFT_ICO)
    //     }
    //   }
    // }   
  }
}
