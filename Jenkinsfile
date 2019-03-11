pipeline {
  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    disableConcurrentBuilds()
  }
  agent any
  environment {
    IMAGE      = "juxtapose"
    TEMP_IMAGE = "juxtapose-build_${BUILD_NUMBER}"
    TAG_VERSION     = getPackageVersion()
  }
  stages {
    stage('Prepare') {
        steps {
          sh 'docker pull jc21/node'
      }
    }
    stage('Build') {
      steps {
        ansiColor('xterm') {
          sh 'docker run --rm -v $(pwd):/srv/app jc21/node yarn install'
          sh 'docker run --rm -v $(pwd):/srv/app jc21/node gulp build'
          sh 'rm -rf node_modules'
          sh 'docker run --rm -v $(pwd):/srv/app jc21/node yarn install --prod'
          sh 'docker run --rm -v $(pwd):/data $DOCKER_CI_TOOLS node-prune'
          sh 'docker build -t $TEMP_IMAGE .'
          sh 'rm -rf zips'
          sh 'mkdir -p zips'
          sh 'docker run --rm -v $(pwd):/data/juxtapose -w /data $DOCKER_CI_TOOLS zip -qr "/data/juxtapose/zips/juxtapose_$TAG_VERSION.zip" juxtapose -x *.gitkeep juxtapose/zips/* juxtapose/bin/* juxtapose/config/my.cnf juxtapose/data/* juxtapose/src/frontend/* juxtapose/test/* juxtapose/node_modules/* juxtapose/.git/* juxtapose/.env juxtapose/.gitignore juxtapose/docker-compose.yml juxtapose/Dockerfile juxtapose/gulpfile.js juxtapose/knexfile.js juxtapose/nodemon.json juxtapose/webpack.config.js juxtapose/webpack_stats.html'
        }
      }
    }
    stage('Publish PR') {
      when {
        changeRequest()
      }
      steps {
        ansiColor('xterm') {
          sh 'docker tag $TEMP_IMAGE docker.io/jc21/$IMAGE:${IMAGE}:github-${BRANCH_LOWER}'
          withCredentials([usernamePassword(credentialsId: 'jc21-dockerhub', passwordVariable: 'dpass', usernameVariable: 'duser')]) {
            sh "docker login -u '${duser}' -p '${dpass}'"
            sh 'docker push docker.io/jc21/$IMAGE:${IMAGE}:github-${BRANCH_LOWER}'
          }
          script {
            def comment = pullRequest.comment("Docker Image for build ${BUILD_NUMBER} is available on [DockerHub](https://cloud.docker.com/repository/docker/jc21/${IMAGE}) as `jc21/${IMAGE}:github-${BRANCH_LOWER}`")
          }
          sh 'docker rmi docker.io/jc21/$IMAGE:${IMAGE}:github-${BRANCH_LOWER}'
        }
      }
    }
    stage('Publish Develop') {
      when {
        branch 'develop'
      }
      steps {
        ansiColor('xterm') {
          sh 'docker tag $TEMP_IMAGE docker.io/jc21/$IMAGE:${IMAGE}:develop'
          withCredentials([usernamePassword(credentialsId: 'jc21-dockerhub', passwordVariable: 'dpass', usernameVariable: 'duser')]) {
            sh "docker login -u '${duser}' -p '${dpass}'"
            sh 'docker push docker.io/jc21/$IMAGE:${IMAGE}:develop'
          }
          sh 'docker rmi docker.io/jc21/$IMAGE:${IMAGE}:develop'
        }
      }
    }
    stage('Publish Master') {
      when {
        branch 'master'
      }
      steps {
        sh 'docker tag $TEMP_IMAGE docker.io/jc21/$IMAGE:latest'
        sh 'docker tag $TEMP_IMAGE docker.io/jc21/$IMAGE:$TAG_VERSION'

        withCredentials([usernamePassword(credentialsId: 'jc21-dockerhub', passwordVariable: 'dpass', usernameVariable: 'duser')]) {
          sh "docker login -u '${duser}' -p '${dpass}'"
          sh 'docker push docker.io/jc21/$IMAGE:latest'
          sh 'docker push docker.io/jc21/$IMAGE:$TAG_VERSION'
        }

        sh 'docker rmi docker.io/jc21/$IMAGE:latest'
        sh 'docker rmi docker.io/jc21/$IMAGE:$TAG_VERSION'

        dir(path: 'zips') {
            archiveArtifacts(artifacts: '**/*.zip', caseSensitive: true, onlyIfSuccessful: true)
        }
      }
    }
  }
  post {
    success {
      juxtapose event: 'success'
      sh 'figlet "SUCCESS"'
    }
    failure {
      juxtapose event: 'failure'
      sh 'figlet "FAILURE"'
    }
    always {
      sh 'docker rmi  $TEMP_IMAGE'
    }
  }
}

def getPackageVersion() {
  ver = sh(script: 'docker run --rm -v $(pwd):/data $DOCKER_CI_TOOLS bash -c "cat /data/package.json|jq -r \'.version\'"', returnStdout: true)
  return ver.trim()
}
