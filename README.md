# hmijs
To try out what this is all about:
- Open console inside hmijs root directory an run 'npm install' (installs all required packages) or 'node update' (for just updating already installed packages).
- Install an SQL database if not already available ('mariadb' is recommended).
- Insert demo data by executing 'demo/hmijs_cfg.sql' (drops database and tables if already exists; creates new database and tables; inserts some demo data;).
- Add rights for SELECT, INSERT, UPDATE and DELETE to your database and corresponding to that edit user and password in 'cfg/db_access.json'.
- Change web server port if required in 'main_config.json' (search for 'web_server_port').
- Start program (by running 'main.js').
- Open browser (e,g, http://localhost:8080/).

This should open a web site containing:
- Header containing language selection, refactoring and editor buttons.
- Footer containing information (info button opens popup with more details and history - if some messages are available).
- Main area containing four sections:
  - Data browser (top left)
    - text field showing current path (is editable; 'enter' expands edited path)
    - 'browse': shows database content keys as tree.
    - 'search': enables searching for keys or/and values.
  - Cross references tree (bottom left);
    - 'uses': shows what the selected object in the browser tree above uses for other objects.
	- 'users': shows which other objects use the selected object in the browser tree above.
	- 'browse': selects the currently selected cross references tree object also in the browser tree above
  - Editor (top right):
    - Shows several types of editors depending on the currently selected object inside the browser tree or search result table.
  - Preview (bottom right):
    - Shows several types of viewers depending on the currently selected object inside the browser tree or search result table - or (if selected afterwards) the currently selected object inside the cross references tree.
	
The follwing objects types are supported:
- JSON:
  - all primitive types like boolean, numbers and strings
  - objects
  - arrays
  - functions
- TEXT:
  - plain text (utf-8)
- LABEL:
  - for each configured language a short string may be edited
- HTML:
  - for each configured language a html text may be edited

Note:
All types of data will be stored in a separate table inside your data base.
Therefore the database configuration must correspond to your configuration parameters in 'cfg/db_config.json'.
This file also containes the available languages which must correspond to the column names of the LABEL and HTML table.


So what ist the plan for the future?
The idea for 'hmijs' is to use it as an HMI content management system.
Therefore we need access to some control system and the plan is to talk to a Beckhoff PLC using ADS.
There is a npm package available we could probably use called 'node-ads'.
So the roadmap could be:
- Develop server side data handler connecting to PLC using ADS
- Add feature for subscribing and unsubscribing multiple observers for PLC variables (handling the requirement of actually listening via ADS to some variable or not depending on the existence of observers)
- Add websocket and instantiation for each client
- Add client side proxy for data handler with same interface as on server side to enable same features as on server
