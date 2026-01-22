pipeline {
	agent any
	options {
		buildDiscarder(logRotator(numToKeepStr: '10'))
		disableConcurrentBuilds()
		ansiColor('xterm')
	}
	environment {
		IMAGE_NAME      = 'juxtapose'
		TEMP_IMAGE_NAME = "juxtapose-build_$BUILD_NUMBER"
		TAG_VERSION     = getPackageVersion()
	}
	stages {
		stage('Build') {
			steps {
				sh 'docker build -t "$TEMP_IMAGE_NAME" -f docker/Dockerfile .'
			}
		}
		stage('Publish') {
			when {
				branch 'master'
			}
			steps {
				sh 'docker tag "$TEMP_IMAGE_NAME" "docker.io/jc21/$IMAGE_NAME:latest"'
				sh 'docker tag "$TEMP_IMAGE_NAME" "docker.io/jc21/$IMAGE_NAME:$TAG_VERSION"'

				withCredentials([usernamePassword(credentialsId: 'jc21-dockerhub', passwordVariable: 'dpass', usernameVariable: 'duser')]) {
					sh 'docker login -u "${duser}" -p "$dpass"'
					sh 'docker push "docker.io/jc21/$IMAGE_NAME:latest"'
					sh 'docker push "docker.io/jc21/$IMAGE_NAME:$TAG_VERSION"'
				}
			}
		}
	}
	post {
		always {
			sh 'docker rmi "$TEMP_IMAGE_NAME"'
			printResult(true)
		}
	}
}

def getPackageVersion() {
	ver = sh(script: 'docker run --rm -v $(pwd):/data jc21/ci-tools bash -c "cat /data/package.json|jq -r \'.version\'"', returnStdout: true)
	return ver.trim()
}
