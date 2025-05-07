

a minimalist chess bot powered by the shapesinc api. plays legal moves, talks trash (optional), and never rage quits (hopefully).

## features

- ai-powered chess move generation using shapesinc api
- basic game state handling with support for standard chess rules and chatting 
- web interface

## demo

coming soon or never

## setup

1. clone the repo

```bash
git clone https://github.com/kiyosh11/shapes-chess.git
cd shapes-chess
```
2. install dependencies
```
npm install
```
3. go to https://shapes.inc/developer and get an api key
   
4. add your shape api key and username 



create a .env file:
```
SHAPESINC_SHAPE_USERNAME=shape username 
SHAPESINC_API_KEY=your api key
```
5. run the project


```
npm start
```
usage

start a game, make moves in algebraic notation (e2e4, g1f3, etc.), and watch chesster make its move.

todo

~add trash talking~

~way more harder~

multiplayer mode (?)
