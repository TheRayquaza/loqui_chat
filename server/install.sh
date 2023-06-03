echo "# API
HOST="localhost"
PORT="8080"
FULL_NAME="http://localhost:8080"
JWT_SECRET="524E6FD6CB248841CAC7F3ACC2D4A"

# DB
HOST_DB="localhost"
PORT_DB="3306"
USERNAME_DB="root"
PASSWORD_DB="default_password"
FULL_NAME_DB="mariadb://localhost:3306"
NAME_DB="loqui_chat"
NAME_TABLE_USER_DB="User"
NAME_TABLE_CONVERSATION_DB="Conversation"
NAME_TABLE_CONVERSATION_USER_DB="ConversationUser"
NAME_TABLE_MESSAGE_DB="Message"
LOG_DB="false"
FORCE_RELOAD_DB="false"

# GENERAL
LOG="false"" > .env

sudo mysql -p -e "CREATE DATABASE loqui_chat;"
sudo mysql -p -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'default_password';"

npm i

