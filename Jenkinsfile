pipeline {
    agent any

    environment {
        // ==========================================
        // 1. Docker Registry & Image Configuration
        // ==========================================
        // Set your Docker Hub username here (or any container registry):
        DOCKER_HUB_USER   = 'purvi294'
        IMAGE_NAME        = 'learning-app'
        IMAGE_TAG         = "${BUILD_NUMBER}"
        FULL_IMAGE        = "${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
        LATEST_IMAGE      = "${DOCKER_HUB_USER}/${IMAGE_NAME}:latest"

        // Jenkins Credentials IDs (configured in Jenkins Dashboard)
        DOCKER_CREDENTIALS_ID     = 'dockerhub-credentials'    // Kind: Username with password
        SERVER_SSH_CREDENTIALS_ID = 'server-ssh-credentials'   // Kind: SSH Username with private key

        // ==========================================
        // 2. Deployment Server Details
        // ==========================================
        DEPLOY_SERVER_USER = 'shrungi'
        DEPLOY_SERVER_HOST = '127.0.0.1'                       // Localhost or server IP
        DEPLOY_PATH        = '/home/shrungi/learning-app-deploy'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "📥 Step 1: Checking out code from Git..."
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                echo "🧪 Step 2: Running npm build verification..."
                sh '''
                    npm ci
                    npm run build
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🐳 Step 3: Building Docker Image: ${FULL_IMAGE}..."
                sh """
                    docker build -t ${FULL_IMAGE} -t ${LATEST_IMAGE} .
                """
            }
        }

        stage('Push Image to Docker Hub') {
            steps {
                echo "🚀 Step 4: Authenticating & pushing image to Docker Hub..."
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASSWORD'
                )]) {
                    sh """
                        # Secure Docker Hub login
                        echo "\$DH_PASSWORD" | docker login -u "\$DH_USER" --password-stdin

                        # Push both tagged version and latest
                        docker push ${FULL_IMAGE}
                        docker push ${LATEST_IMAGE}

                        # Logout
                        docker logout
                    """
                }
            }
        }

        stage('Deploy via SSH with Docker Pull') {
            steps {
                echo "📡 Step 5: Connecting via SSH to ${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_HOST} to deploy..."
                sshagent([SERVER_SSH_CREDENTIALS_ID]) {
                    sh """
                        # 1. Ensure target deployment folder exists on server
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_HOST} "mkdir -p ${DEPLOY_PATH}"

                        # 2. Transfer docker-compose.yml to server
                        scp -o StrictHostKeyChecking=no docker-compose.yml ${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_HOST}:${DEPLOY_PATH}/docker-compose.yml

                        # 3. Ensure target .env exists (copy from workspace if missing)
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_HOST} "
                            if [ ! -f ${DEPLOY_PATH}/.env ]; then
                                cp /var/www/html/Node-js/Learning/.env ${DEPLOY_PATH}/.env || touch ${DEPLOY_PATH}/.env
                            fi
                        "

                        # 4. Pull fresh image from Docker Hub and restart container with Docker Compose
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_HOST} "
                            cd ${DEPLOY_PATH}
                            export DOCKER_IMAGE=${FULL_IMAGE}
                            docker compose pull
                            docker compose down --remove-orphans || true
                            docker compose up -d --remove-orphans
                        "
                    """
                }
            }
        }

        stage('Verify Health Check') {
            steps {
                echo "🩺 Step 6: Verifying container health on server..."
                sshagent([SERVER_SSH_CREDENTIALS_ID]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_HOST} "
                            cd ${DEPLOY_PATH}
                            sleep 5
                            docker compose ps
                        "
                    """
                }
            }
        }
    }

    post {
        always {
            echo "🧹 Cleaning up unused Docker images..."
            sh 'docker image prune -f'
        }
        success {
            echo "🎉 Pipeline finished successfully! Image pushed to Docker Hub and deployed."
        }
        failure {
            echo "❌ Pipeline failed. Please check the logs above."
        }
    }
}
