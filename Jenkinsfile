pipeline {
  options {
    buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '10'))
    disableConcurrentBuilds()
  }
  agent any
  environment {
    IMAGE_NAME      = "juxtapose"
    TEMP_IMAGE_NAME = "juxtapose-build_${BUILD_NUMBER}"
    TAG_VERSION     = getPackageVersion()
  }
  stages {
    stage('Prepare') {
        steps {
          sh 'docker pull jc21/node'
          sh 'docker pull $DOCKER_CI_TOOLS'
          sh 'docker run --rm -v $(pwd):/srv/app jc21/node npm --registry=$NPM_REGISTRY install'
          sh 'docker run --rm -v $(pwd):/srv/app jc21/node gulp build'
          sh 'docker run --rm -v $(pwd):/srv/app -e NODE_ENV=production jc21/node npm prune --production'
          sh 'docker run --rm -v $(pwd):/data $DOCKER_CI_TOOLS node-prune'
      }
    }
    stage('Build') {
      steps {
        sh 'docker build -t $TEMP_IMAGE_NAME .'

        sh '''docker run --rm -v $(pwd):/data/juxtapose -w /data $DOCKER_CI_TOOLS zip -qr "juxtapose_$TAG_VERSION.zip" juxtapose -x \\
\\*.gitkeep \\
juxtapose/bin\\* \\
juxtapose/config/my.cnf \\
juxtapose/data\\* \\
juxtapose/src/frontend\\* \\
juxtapose/test\\* \\
juxtapose/node_modules\\* \\
juxtapose/.git\\* \\
juxtapose/.env \\
juxtapose/.gitignore \\
juxtapose/docker-compose.yml \\
juxtapose/Dockerfile \\
juxtapose/gulpfile.js \\
juxtapose/knexfile.js \\
juxtapose/nodemon.json \\
juxtapose/webpack.config.js \\
juxtapose/webpack_stats.html

exit $?'''
      }
    }
    stage('Publish') {
      when {
        branch 'master'
      }
      steps {
        sh 'docker tag $TEMP_IMAGE_NAME ${DOCKER_PRIVATE_REGISTRY}/$IMAGE_NAME:latest'
        sh 'docker push ${DOCKER_PRIVATE_REGISTRY}/$IMAGE_NAME:latest'
        sh 'docker tag $TEMP_IMAGE_NAME ${DOCKER_PRIVATE_REGISTRY}/$IMAGE_NAME:$TAG_VERSION'
        sh 'docker push ${DOCKER_PRIVATE_REGISTRY}/$IMAGE_NAME:$TAG_VERSION'
        sh 'docker tag $TEMP_IMAGE_NAME docker.io/jc21/$IMAGE_NAME:latest'
        sh 'docker tag $TEMP_IMAGE_NAME docker.io/jc21/$IMAGE_NAME:$TAG_VERSION'

        withCredentials([usernamePassword(credentialsId: 'jc21-dockerhub', passwordVariable: 'dpass', usernameVariable: 'duser')]) {
          sh "docker login -u '${duser}' -p '$dpass'"
          sh 'docker push docker.io/jc21/$IMAGE_NAME:latest'
          sh 'docker push docker.io/jc21/$IMAGE_NAME:$TAG_VERSION'
        }

        sh 'docker rmi  $TEMP_IMAGE_NAME'

        archiveArtifacts(artifacts: '**/juxtapose_*.zip', caseSensitive: true, onlyIfSuccessful: true)
      }
    }
  }
  triggers {
    bitbucketPush()
  }
  post {
    success {
      slackSend color: "#72c900", message: "SUCCESS: <${BUILD_URL}|${JOB_NAME}> build #${BUILD_NUMBER} - Duration: ${currentBuild.durationString}"
    }
    failure {
      slackSend color: "#d61111", message: "FAILED: <${BUILD_URL}|${JOB_NAME}> build #${BUILD_NUMBER} - Duration: ${currentBuild.durationString}"
    }
  }
}

def getPackageVersion() {
  ver = sh(script: 'docker run --rm -v $(pwd):/data $DOCKER_CI_TOOLS bash -c "cat /data/package.json|jq -r \'.version\'"', returnStdout: true)
  return ver.trim()
}
