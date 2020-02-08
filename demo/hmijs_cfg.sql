-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server Version:               10.1.22-MariaDB - mariadb.org binary distribution
-- Server Betriebssystem:        Win64
-- HeidiSQL Version:             9.4.0.5125
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Exportiere Datenbank Struktur für hmijs_cfg
DROP DATABASE IF EXISTS `hmijs_cfg`;
CREATE DATABASE IF NOT EXISTS `hmijs_cfg` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `hmijs_cfg`;

-- Exportiere Struktur von Tabelle hmijs_cfg.htm
DROP TABLE IF EXISTS `htm`;
CREATE TABLE IF NOT EXISTS `htm` (
  `key` varchar(384) NOT NULL,
  `value_de` mediumtext,
  `value_en` mediumtext,
  `value_es` mediumtext,
  `value_fr` mediumtext,
  `value_it` mediumtext,
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Exportiere Daten aus Tabelle hmijs_cfg.htm: ~9 rows (ungefähr)
DELETE FROM `htm`;
/*!40000 ALTER TABLE `htm` DISABLE KEYS */;
/*!40000 ALTER TABLE `htm` ENABLE KEYS */;

-- Exportiere Struktur von Tabelle hmijs_cfg.jso
DROP TABLE IF EXISTS `jso`;
CREATE TABLE IF NOT EXISTS `jso` (
  `key` varchar(384) NOT NULL,
  `value` mediumtext NOT NULL,
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Exportiere Daten aus Tabelle hmijs_cfg.jso: ~91 rows (ungefähr)
DELETE FROM `jso`;
/*!40000 ALTER TABLE `jso` DISABLE KEYS */;
INSERT INTO `jso` (`key`, `value`) VALUES
	('demo/maze/button_size', '"64px"'),
	('demo/maze/game', '{"type":"grid","id":"maze","separator":4,"columns":[1,"include:$demo/maze/button_size.j","include:$demo/maze/button_size.j","include:$demo/maze/button_size.j"],"rows":["include:$demo/maze/button_size.j",1,"include:$demo/maze/button_size.j","include:$demo/maze/button_size.j","include:$demo/maze/button_size.j",1],"children":[{"x":0,"y":1,"width":1,"height":5,"object":{"droppable":"maze","type":"grid","columns":1,"rows":1,"children":[]}},{"x":2,"y":2,"id":"north","image":"images/arrows/arrow-up.png","border":true,"pressed":"function() {\\nvar maze = this.hmi_node(\'../maze\');\\nif (maze) {\\nmaze.order = \'north\';\\n}\\n}"},{"x":2,"y":4,"id":"south","image":"images/arrows/arrow-down.png","border":true,"pressed":"function() {\\nvar maze = this.hmi_node(\'../maze\');\\nif (maze) {\\nmaze.order = \'south\';\\n}\\n}"},{"x":1,"y":3,"id":"west","image":"images/arrows/arrow-left.png","border":true,"pressed":"function() {\\nvar maze = this.hmi_node(\'../maze\');\\nif (maze) {\\nmaze.order = \'west\';\\n}\\n}"},{"x":3,"y":3,"id":"east","image":"images/arrows/arrow-right.png","border":true,"pressed":"function() {\\nvar maze = this.hmi_node(\'../maze\');\\nif (maze) {\\nmaze.order = \'east\';\\n}\\n}"},{"x":0,"y":0,"width":1,"height":1,"include":"$demo/maze/mazes.j"},{"x":3,"y":0,"width":1,"height":1,"id":"show","image":"images/question/question-balloon.png","border":true,"pressed":"function() {\\nvar maze = this.hmi_node(\'../maze\');\\nif (maze) {\\nmaze.show = true;\\n}\\n}"}],"prepare":"function(that, i_success, i_error) {\\nthis._north = this.hmi_node(\'north\');\\nthis._south = this.hmi_node(\'south\');\\nthis._west = this.hmi_node(\'west\');\\nthis._east = this.hmi_node(\'east\');\\nthis.hmi_attr(\'tabindex\', \'1\');\\nvar that = this;\\nthis._handle_key = function(i_event) {\\nvar maze = that.hmi_node(\'maze\');\\nif (maze) {\\nswitch (i_event.which) {\\ncase 38: // up\\nmaze.order = \'north\';\\ni_event.preventDefault();\\nbreak;\\ncase 40: // down\\nmaze.order = \'south\';\\ni_event.preventDefault();\\nbreak;\\ncase 37: // left\\nmaze.order = \'west\';\\ni_event.preventDefault();\\nbreak;\\ncase 39: // right\\nmaze.order = \'east\';\\ni_event.preventDefault();\\nbreak;\\ndefault:\\n// console.log(\'invalid key: \' + i_event.which);\\nbreak;\\n}\\n}\\n};\\nthis.hmi_element().on(\'keydown\', this._handle_key);\\ni_success();\\n}","destroy":"function(that, i_success, i_error) {\\nthis.hmi_element().off(\'keydown\', this._handle_key);\\ndelete this._handle_key;\\ndelete this._north;\\ndelete this._south;\\ndelete this._west;\\ndelete this._east;\\ni_success();\\n}","refresh":"function(i_date) {\\nvar maze = this.hmi_node(\'maze\');\\nthis._north[maze && maze.northEnabled ? \'hmi_addClass\' : \'hmi_removeClass\'](\'highlighted-blue\');\\nthis._south[maze && maze.southEnabled ? \'hmi_addClass\' : \'hmi_removeClass\'](\'highlighted-blue\');\\nthis._west[maze && maze.westEnabled ? \'hmi_addClass\' : \'hmi_removeClass\'](\'highlighted-blue\');\\nthis._east[maze && maze.eastEnabled ? \'hmi_addClass\' : \'hmi_removeClass\'](\'highlighted-blue\');\\n}"}'),
	('demo/maze/graph/core/fn_add_wall_points', '"function(i_maze, i_points) {\\n// itearte over all maze cells and add walls if required\\nvar width = i_maze.width;\\nvar height = i_maze.height;\\nvar x, y;\\nfor (x = 0; x < width; x++) {\\nfor (y = 0; y < height; y++) {\\nvar cell = i_maze.cell(x, y);\\nif (x === 0 && cell.west === true) {\\ni_points.push({\\nx: x - 0.5,\\ny: y - 0.5,\\nmove: true\\n});\\ni_points.push({\\nx: x - 0.5,\\ny: y + 0.5\\n});\\n}\\nif (y === 0 && cell.north === true) {\\ni_points.push({\\nx: x - 0.5,\\ny: y - 0.5,\\nmove: true\\n});\\ni_points.push({\\nx: x + 0.5,\\ny: y - 0.5\\n});\\n}\\nif (cell.east === true) {\\ni_points.push({\\nx: x + 0.5,\\ny: y - 0.5,\\nmove: true\\n});\\ni_points.push({\\nx: x + 0.5,\\ny: y + 0.5\\n});\\n}\\nif (cell.south === true) {\\ni_points.push({\\nx: x - 0.5,\\ny: y + 0.5,\\nmove: true\\n});\\ni_points.push({\\nx: x + 0.5,\\ny: y + 0.5\\n});\\n}\\n}\\n}\\n}"'),
	('demo/maze/graph/core/fn_get_random_border_point', '"function(i_width, i_height, i_point) {\\n// compute one-trip-around-offset\\nvar offset = Math.floor(Math.random() * (i_width + i_height - 2) * 2);\\n// if north\\nif (offset < i_width - 1) {\\ni_point.x = offset;\\ni_point.y = 0;\\nreturn;\\n}\\noffset -= i_width - 1;\\n// if east\\nif (offset < i_height - 1) {\\ni_point.x = i_width - 1;\\ni_point.y = offset;\\nreturn;\\n}\\noffset -= i_height - 1;\\n// if south\\nif (offset < i_width - 1) {\\ni_point.x = i_width - 1 - offset;\\ni_point.y = i_height - 1;\\nreturn;\\n}\\noffset -= i_width - 1;\\n// if west\\nif (offset < i_height - 1) {\\ni_point.x = 0;\\ni_point.y = i_height - 1 - offset;\\nreturn;\\n}\\n// should not occurr\\ni_point.x = 0;\\ni_point.y = 0;\\nconsole.error(\'EXCEPTION! Invalid random offset!\');\\n}"'),
	('demo/maze/graph/core/maze_game', '{"p_mode_diagonal":"diagonal","p_mode_farest":"farest","p_mode_":true,"p_border_":true,"p_showPath":true,"p_width":23,"p_height":8,"p_delta":0.25,"id":"maze","type":"graph","zoom":true,"mirrorX":false,"mirrorY":false,"bounds":{},"strokeStyle":"black","lineWidth":"2px","_classes":"default-background-dark","border":false,"points":[],"children":[],"_add_wall_points":"include:$demo/maze/graph/core/fn_add_wall_points.j","_get_random_border_point":"include:$demo/maze/graph/core/fn_get_random_border_point.j","_init_game":"function() {\\nvar maze = this._maze;\\nif (maze) {\\n// prepare for next run\\ndelete this.show;\\ndelete this._time;\\ndelete this._running;\\nvar i;\\n// prepare random maze and get walls\\nmaze.prepare(this.p_width, this.p_height);\\nthis.points.splice(0, this.points.length);\\nthis._add_wall_points(maze, this.points);\\n// get path\\nvar width = maze.width;\\nvar height = maze.height;\\nif (this._path.hmi_setVisible) {\\nthis._path.hmi_setVisible(false);\\n}\\nvar graph = this._graph;\\nvar x, y;\\n// first we got to add all edges\\nfor (x = 0; x < width; x++) {\\nfor (y = 1; y < height; y++) {\\nvar cell2 = maze.cell(x, y);\\nif (cell2.north !== true) {\\nvar cell1 = maze.cell(x, y - 1);\\ngraph.addEdge(undefined, cell1, cell2, 1.0);\\n}\\n}\\n}\\nfor (y = 0; y < height; y++) {\\nfor (x = 1; x < width; x++) {\\nvar cell2 = maze.cell(x, y);\\nif (cell2.west !== true) {\\nvar cell1 = maze.cell(x - 1, y);\\ngraph.addEdge(undefined, cell1, cell2, 1.0);\\n}\\n}\\n}\\nvar walker = this._walker;\\nvar border = this.p_border;\\nif (border !== true) {\\nborder = Math.random() >= 0.2718;\\n}\\nif (border) {\\n// place walker at random border location\\nthis._get_random_border_point(this.p_width, this.p_height, walker);\\n} else {\\n// place walker at random anywhere location\\nwalker.x = Math.floor(Math.random() * this.p_width);\\nwalker.y = Math.floor(Math.random() * this.p_height);\\n}\\n// store cell indices\\nthis._col = walker.x;\\nthis._row = walker.y;\\nthis._startX = walker.x;\\nthis._startY = walker.y;\\nvar target = this._target;\\nvar mode = this.p_mode;\\nif (typeof mode !== \'string\') {\\nmode = Math.floor(Math.random() * 2);\\n}\\nswitch (mode) {\\ncase \'farest\':\\ncase 0:\\n// compute all possible paths to the target and the select the farest\\ngraph.computePath(maze.cell(walker.x, walker.y), undefined);\\ngraph.selectFarestNode();\\nvar cell = graph.getNode(graph.getNodesCount() - 1);\\ntarget.x = cell.x;\\ntarget.y = cell.y;\\nbreak;\\ncase \'diagonal\':\\ncase 1:\\ndefault:\\n// locate walker (at opposite position)\\ntarget.x = this.p_width - 1 - walker.x;\\ntarget.y = this.p_height - 1 - walker.y;\\nbreak;\\n}\\n}\\n}","init":"function() {\\nthis._init_game();\\n}","build":"function(that, i_success, i_error) {\\n// create mace generator\\nvar maze = new this.hmi.lib.math.Maze();\\nthis._maze = maze;\\nthis.bounds.x1 = -1;\\nthis.bounds.y1 = -1;\\nthis.bounds.x2 = this.p_width;\\nthis.bounds.y2 = this.p_height + 0.5;\\n// target\\nvar target = {\\ntype: \\"graph\\",\\nfillStyle: \\"green\\",\\nstrokeStyle: \\"white\\",\\nlineWidth: \\"1px\\",\\nwidth: 0.8,\\nheight: 0.8\\n};\\nthis.children.push(target);\\nthis._target = target;\\nvar walker = {\\ntype: \\"graph\\",\\nfillStyle: \\"blue\\",\\nstrokeStyle: \\"white\\",\\nlineWidth: \\"1px\\",\\nr: 0.4\\n};\\nthis.children.push(walker);\\nthis._walker = walker;\\n// info\\nvar info = {\\nx: this.p_width - 0.5,\\ny: this.p_height,\\ntype: \\"graph\\",\\nstrokeStyle: \\"black\\",\\nfontSize: \\"14px\\",\\nalign: \'right\'\\n};\\nthis.children.push(info);\\nthis._info = info;\\n// path analyzer\\nthis._graph = new this.hmi.lib.math.WeightedGraph();\\nthis._path = {\\ntype: \'graph\',\\nvisible: false,\\nstrokeStyle: \\"magenta\\",\\nlineWidth: 0.2,\\npoints: [],\\nz: -10\\n};\\nthis.children.push(this._path);\\n// walls\\nthis._init_game();\\ni_success();\\n}","cleanup":"function(that, i_success, i_error) {\\nthis._graph.destroy();\\ndelete this._graph;\\ndelete this._path;\\ndelete this._maze;\\nthis.points.splice(0, this.points.length);\\nthis.children.splice(0, this.children.length);\\ndelete this._walker;\\ndelete this._target;\\ndelete this._info;\\ni_success();\\n}","refresh":"function(i_date) {\\nvar col = this._col;\\nvar row = this._row;\\nvar tgt = this._target;\\n// time\\nvar time = this._time;\\nif (time === undefined) {\\nthis._time = i_date.getTime();\\n} else if ((col !== tgt.x || row !== tgt.y) && this.show !== true) {\\nthis._millis = i_date.getTime() - time;\\n}\\nif (this._millis !== undefined) {\\nthis._info.text = Utilities.formatNumber(this._millis * 0.001, 3) + \' s\';\\n}\\n// get current cell\\nvar maze = this._maze;\\nvar cell = maze.cell(col, row);\\n// if not already running and we got a new order\\nif (this._running === undefined && this.order !== undefined) {\\nswitch (this.order) {\\ncase \'north\':\\nif (!cell.north) {\\nthis._running = this.order;\\n}\\nbreak;\\ncase \'south\':\\nif (!cell.south) {\\nthis._running = this.order;\\n}\\nbreak;\\ncase \'west\':\\nif (!cell.west) {\\nthis._running = this.order;\\n}\\nbreak;\\ncase \'east\':\\nif (!cell.east) {\\nthis._running = this.order;\\n}\\nbreak;\\n}\\n}\\ndelete this.order;\\nvar home = col === tgt.x && row === tgt.y;\\nif (home || this.show === true) {\\ndelete this._running;\\nif (this._path.hmi_isVisible() !== true) {\\nvar points = this._path.points;\\npoints.splice(0, points.length);\\nvar graph = this._graph;\\nvar target = this._target;\\nvar walker = this._walker;\\ngraph.computePath(maze.cell(target.x, target.y), home ? maze.cell(this._startX, this._startY) : maze.cell(this._col, this._row));\\n// draw path\\nvar count = graph.getNodesCount();\\nfor (var i = 0; i < count; i++) {\\nvar cell = graph.getNode(i);\\nvar point = {\\nx: cell.x,\\ny: cell.y\\n};\\nif (i > 0 && i < count - 1) {\\npoint.r = 0.4;\\n}\\npoints.push(point);\\n}\\nthis._path.hmi_setVisible(true);\\n}\\n}\\n// get the current position and perform moving\\nvar wlk = this._walker;\\nvar x = wlk.x;\\nvar y = wlk.y;\\nswitch (this._running) {\\ncase \'north\':\\ny -= this.p_delta;\\nif (y <= row - 1) {\\nrow--;\\ny = row;\\ncell = this._maze.cell(col, row);\\nif ((!cell.north && !cell.west) || (!cell.north && !cell.east) || (!cell.west && !cell.east) ||\\n(cell.north && cell.west && cell.east) || (col === tgt.x && row === tgt.y)) {\\ndelete this._running;\\n} else if (cell.north && !cell.west && cell.east) {\\nthis._running = \'west\';\\n} else if (cell.north && cell.west && !cell.east) {\\nthis._running = \'east\';\\n}\\n}\\nbreak;\\ncase \'south\':\\ny += this.p_delta;\\nif (y >= row + 1) {\\nrow++;\\ny = row;\\ncell = this._maze.cell(col, row);\\nif ((!cell.south && !cell.west) || (!cell.south && !cell.east) || (!cell.west && !cell.east) ||\\n(cell.south && cell.west && cell.east) || (col === tgt.x && row === tgt.y)) {\\ndelete this._running;\\n} else if (cell.south && !cell.west && cell.east) {\\nthis._running = \'west\';\\n} else if (cell.south && cell.west && !cell.east) {\\nthis._running = \'east\';\\n}\\n}\\nbreak;\\ncase \'west\':\\nx -= this.p_delta;\\nif (x <= col - 1) {\\ncol--;\\nx = col;\\ncell = this._maze.cell(col, row);\\nif ((!cell.west && !cell.north) || (!cell.west && !cell.south) || (!cell.north && !cell.south) ||\\n(cell.west && cell.north && cell.south) || (col === tgt.x && row === tgt.y)) {\\ndelete this._running;\\n} else if (cell.west && !cell.north && cell.south) {\\nthis._running = \'north\';\\n} else if (cell.west && cell.north && !cell.south) {\\nthis._running = \'south\';\\n}\\n}\\nbreak;\\ncase \'east\':\\nx += this.p_delta;\\nif (x >= col + 1) {\\ncol++;\\nx = col;\\ncell = this._maze.cell(col, row);\\nif ((!cell.east && !cell.north) || (!cell.east && !cell.south) || (!cell.north && !cell.south) ||\\n(cell.east && cell.north && cell.south) || (col === tgt.x && row === tgt.y)) {\\ndelete this._running;\\n} else if (cell.east && !cell.north && cell.south) {\\nthis._running = \'north\';\\n} else if (cell.east && cell.north && !cell.south) {\\nthis._running = \'south\';\\n}\\n}\\nbreak;\\ndefault:\\nbreak;\\n}\\nthis._col = col;\\nthis._row = row;\\nwlk.x = x;\\nwlk.y = y;\\nif (this._running === undefined && (col !== tgt.x || row !== tgt.y)) {\\nthis.northEnabled = !cell.north;\\nthis.southEnabled = !cell.south;\\nthis.westEnabled = !cell.west;\\nthis.eastEnabled = !cell.east;\\n} else {\\nthis.northEnabled = false;\\nthis.southEnabled = false;\\nthis.westEnabled = false;\\nthis.eastEnabled = false;\\n}\\n}"}'),
	('demo/maze/graph/maze128x56', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":128,"p_height":56}'),
	('demo/maze/graph/maze16x10', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":16,"p_height":10}'),
	('demo/maze/graph/maze18x12', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":18,"p_height":12}'),
	('demo/maze/graph/maze20x14', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":20,"p_height":14}'),
	('demo/maze/graph/maze22x16', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":22,"p_height":16}'),
	('demo/maze/graph/maze24x18', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":24,"p_height":18}'),
	('demo/maze/graph/maze30x20', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":30,"p_height":20}'),
	('demo/maze/graph/maze36x20', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":36,"p_height":20}'),
	('demo/maze/graph/maze42x20', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":42,"p_height":20}'),
	('demo/maze/graph/maze48x20', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":48,"p_height":20}'),
	('demo/maze/graph/maze66x28', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":66,"p_height":28}'),
	('demo/maze/graph/maze92x40', '{"include":"$demo/maze/graph/core/maze_game.j","p_width":92,"p_height":40}'),
	('demo/maze/mazes', '{"type":"grid","separator":6,"margin":true,"columns":13,"rows":1,"children":[{"x":3,"y":0,"draggable":"maze","text":"20x14","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze16x10.j"}},{"x":5,"y":0,"draggable":"maze","text":"24x18","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze24x18.j"}},{"x":7,"y":0,"draggable":"maze","text":"36x20","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze36x20.j"}},{"x":4,"y":0,"draggable":"maze","text":"22x16","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze22x16.j"}},{"x":6,"y":0,"draggable":"maze","text":"30x20","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze30x20.j"}},{"x":8,"y":0,"draggable":"maze","text":"42x20","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze42x20.j"}},{"x":9,"y":0,"draggable":"maze","text":"48x20","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze48x20.j"}},{"x":2,"y":0,"draggable":"maze","text":"18x12","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze18x12.j"}},{"x":1,"y":0,"draggable":"maze","text":"16x10","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze16x10.j"}},{"x":0,"y":0,"bold":true,"text":"MAZE"},{"x":10,"y":0,"draggable":"maze","text":"66x28","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze66x28.j"}},{"x":11,"y":0,"draggable":"maze","text":"92x40","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze92x40.j"}},{"x":12,"y":0,"draggable":"maze","text":"128x56","border":true,"bold":true,"data":{"width":1,"height":1,"object":"$demo/maze/graph/maze128x56.j"}}]}');
/*!40000 ALTER TABLE `jso` ENABLE KEYS */;

-- Exportiere Struktur von Tabelle hmijs_cfg.lab
DROP TABLE IF EXISTS `lab`;
CREATE TABLE IF NOT EXISTS `lab` (
  `key` varchar(384) NOT NULL,
  `value_de` tinytext,
  `value_en` tinytext,
  `value_es` tinytext,
  `value_fr` tinytext,
  `value_it` tinytext,
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Exportiere Daten aus Tabelle hmijs_cfg.lab: ~15 rows (ungefähr)
DELETE FROM `lab`;
/*!40000 ALTER TABLE `lab` DISABLE KEYS */;
/*!40000 ALTER TABLE `lab` ENABLE KEYS */;

-- Exportiere Struktur von Tabelle hmijs_cfg.txt
DROP TABLE IF EXISTS `txt`;
CREATE TABLE IF NOT EXISTS `txt` (
  `key` varchar(384) NOT NULL,
  `value` mediumtext NOT NULL,
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT;

-- Exportiere Daten aus Tabelle hmijs_cfg.txt: ~14 rows (ungefähr)
DELETE FROM `txt`;
/*!40000 ALTER TABLE `txt` DISABLE KEYS */;
/*!40000 ALTER TABLE `txt` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
