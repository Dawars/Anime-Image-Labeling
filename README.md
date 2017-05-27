# Anime-Image-Labeling
A small web app to crowdsource anime and cartoon image labeling

![Tutorial](img/tutorial_page.png?raw=true "Tutorial")

The latest version is available at: http://dawars.me/anime

- - -


- [Progress](#progress)
- [Browser support](#browser-support)
- [Features](#features)
- [Used tecnhologies](#used-technologies)

## Progress:
- [x] Design (Responsive, made for mobile)
- [x] Tutorial
- [x] Setting up database
- [x] Setting up backend
- [ ] Uploading raw images (20%)

## [Browser support](https://godban.github.io)

| [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/edge.png" alt="IE / Edge" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/firefox.png" alt="Firefox" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome.png" alt="Chrome" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome-android.png" alt="Chrome for Android" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome for Android |
| --------- | --------- | --------- | --------- |
| IE11, Edge| last 2 versions| last 2 versions| last 2 versions


# Features:
## Tutorial
![Tutorial](img/tutorial.png?raw=true "Tutorial")

![Correct answer](img/correct.png?raw=true "Correct answer")
![Wrong answer](img/wrong.png?raw=true "Wrong answer")

## 404 page
![Tutorial](img/not_found.png?raw=true "Tutorial")

## Source
![Tutorial](img/tooltip.png?raw=true "Tutorial")

# Used technologies

## Front-end
- jQuery
- [Material Design Light](https://github.com/google/material-design-lite)
- dialog-polyfill.js - `<dialog>` tag

## Back-end
* Node.js (with IIS7)
* Express
    * body-parser
    * [mysqljs](https://github.com/mysqljs/mysql)
* Hogan - templating engine
* MySql - relational database
