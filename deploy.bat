@echo off  
echo === Blog Deployment ===  
  
echo 1. Pulling latest code...  
git pull  
  
echo 2. Installing dependencies...  
call npm ci  
  
echo 3. Building...  
call npm run build  
  
echo 4. Starting server...  
pm2 restart blog || pm2 start server/index.ts --name blog  
  
echo === Deployment Complete ===  
pm2 status  
pause 
