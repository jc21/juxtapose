-- This is used for development, to allow connecting to the mariadb docker container from pretty much anywhere.
GRANT CREATE, SELECT, INSERT, UPDATE, DELETE, DROP ON * . * TO  'juxtapose'@'%' IDENTIFIED BY 'juxtapose' WITH MAX_QUERIES_PER_HOUR 0 MAX_CONNECTIONS_PER_HOUR 0 MAX_UPDATES_PER_HOUR 0 MAX_USER_CONNECTIONS 0;
GRANT ALL PRIVILEGES ON  `juxtapose`.* TO  'juxtapose'@'%';
