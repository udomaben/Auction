@echo off
echo Setting up Auction Platform Database...

echo Creating database...
psql -U postgres -c "CREATE DATABASE auction_platform;"

echo Running migrations...
cd backend
npm run migrate

echo Running seeds...
npm run seed

echo Done!
pause