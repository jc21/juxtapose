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
      }
    }
    stage('Build') {
      steps {
        sh 'docker run --rm -v $(pwd):/srv/app jc21/node yarn --registry=$NPM_REGISTRY install'
        sh 'docker run --rm -v $(pwd):/srv/app jc21/node gulp build'
        sh 'rm -rf node_modules'
        sh 'docker run --rm -v $(pwd):/srv/app jc21/node yarn --registry=$NPM_REGISTRY install --prod'
        sh 'docker run --rm -v $(pwd):/data $DOCKER_CI_TOOLS node-prune'
        sh 'docker build -t $TEMP_IMAGE_NAME .'
        sh 'rm -rf zips'
        sh 'mkdir -p zips'
        sh 'docker run --rm -v $(pwd):/data/juxtapose -w /data $DOCKER_CI_TOOLS zip -qr "/data/juxtapose/zips/juxtapose_$TAG_VERSION.zip" juxtapose -x *.gitkeep juxtapose/zips/* juxtapose/bin/* juxtapose/config/my.cnf juxtapose/data/* juxtapose/src/frontend/* juxtapose/test/* juxtapose/node_modules/* juxtapose/.git/* juxtapose/.env juxtapose/.gitignore juxtapose/docker-compose.yml juxtapose/Dockerfile juxtapose/gulpfile.js juxtapose/knexfile.js juxtapose/nodemon.json juxtapose/webpack.config.js juxtapose/webpack_stats.html'
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

        dir(path: 'zips') {
            archiveArtifacts(artifacts: '**/*.zip', caseSensitive: true, onlyIfSuccessful: true)
        }
      }
    }
  }
  triggers {
    bitbucketPush()
  }
  post {
    success {
      slackSend color: "#72c900", message: "SUCCESS: <${BUILD_URL}|${JOB_NAME}> build #${BUILD_NUMBER} - ${currentBuild.durationString}"
      juxtapose event: 'success'
      sh 'figlet "SUCCESS"'
    }
    failure {
      slackSend color: "#d61111", message: "FAILED: <${BUILD_URL}|${JOB_NAME}> build #${BUILD_NUMBER} - ${currentBuild.durationString}"
      juxtapose event: 'failure'
      sh 'figlet "FAILURE"'
    }
    always {
      sh 'docker rmi  $TEMP_IMAGE_NAME'
    }
  }
}

def getPackageVersion() {
  ver = sh(script: 'docker run --rm -v $(pwd):/data $DOCKER_CI_TOOLS bash -c "cat /data/package.json|jq -r \'.version\'"', returnStdout: true)
  return ver.trim()
}
