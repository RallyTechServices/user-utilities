BulkUserUtilityApp
=========================

## Overview
This app is for bulk assigning user permissions, bulk removing user permissions and assigning team memberships.  

##Filters 
This app has 2 types of filters: 1.  The standard advanced filter and a user list filter. 

The standard advanced filters are available for users in the grid.  
![ScreenShot](/images/advanced-filter.png)

The advanced filter also includes a "Has Permissions in Project" Quick Filter that allows filtering all users that exist in the selected project: 
![ScreenShot](/images/project_permissions_filter.png)

An additional User List Filter.  A delimited string of usernames can be pasted into this filter to filter out all users whose usernames match the ones in the list.  Delimiters can be commas, tabs or line feeds.  
![ScreenShot](/images/bulk-user-filter.png)


##Features
View permissions in the current workspace for any user by clicking the gear menu and select view permissions.  

Assign or Remove permissions or Add Team Memberships in bulk by selecting the checkbox for 1 to many users and choosing the action.
![ScreenShot](/images/bulk-menu.png)


##Notes 
Permissions can only be assigned to projects within the workspace that the app is installed for.  

This app will only run for Project Administrators in the current workspace, Workspace Administrators in the current workspace, and Subscription Administrators.  

If a user is a Project Administrator, they will only be able to see other users' permissions for the projects that they are administrators of.  

Permissions can only be updated for users who are not Workspace or Subscription administrators.  The bulk options will not be available if users who are Workspace or Subscription administrators are selected.  To prevent this, filter on only users who are Workspace Users (not Administrators).    


##Updates: 

2017-02-07 
Fix bug in "Has Permissions in Project" filter where all permissions were not being retrieved.  
Reduced page sizes to 200 or less.

2017-02-03
Improve performance of "Has Permissions in Project" filter
Expand Assign/Remove Permissions grid to full window 
 
2017-01-20
Added checkbox to downgrade existing project permissions (if less than what user currently has and user is not workspace or subscription administrator)
Minor UI updates

2017-01-11
Minor UI updates
Fixed issue updating hierarchy of Team Membership
Fixed concurrency issue 


## License

BulkUserUtilityApp is released under the MIT license.  See the file [LICENSE](./LICENSE) for the full text.

##Documentation for SDK

You can find the documentation on our help [site.](https://help.rallydev.com/apps/2.1/doc/)



## Development Notes

### First Load

If you've just downloaded this from github and you want to do development, 
you're going to need to have these installed:

 * node.js
 * grunt-cli
 * grunt-init
 
Since you're getting this from github, we assume you have the command line
version of git also installed.  If not, go get git.

If you have those three installed, just type this in the root directory here
to get set up to develop:

  npm install

### Structure

  * src/javascript:  All the JS files saved here will be compiled into the 
  target html file
  * src/style: All of the stylesheets saved here will be compiled into the 
  target html file
  * test/fast: Fast jasmine tests go here.  There should also be a helper 
  file that is loaded first for creating mocks and doing other shortcuts
  (fastHelper.js) **Tests should be in a file named <something>-spec.js**
  * test/slow: Slow jasmine tests go here.  There should also be a helper
  file that is loaded first for creating mocks and doing other shortcuts 
  (slowHelper.js) **Tests should be in a file named <something>-spec.js**
  * templates: This is where templates that are used to create the production
  and debug html files live.  The advantage of using these templates is that
  you can configure the behavior of the html around the JS.
  * config.json: This file contains the configuration settings necessary to
  create the debug and production html files.  
  * package.json: This file lists the dependencies for grunt
  * auth.json: This file should NOT be checked in.  Create this to create a
  debug version of the app, to run the slow test specs and/or to use grunt to
  install the app in your test environment.  It should look like:
    {
        "username":"you@company.com",
        "password":"secret",
        "server": "https://rally1.rallydev.com"
    }
  
### Usage of the grunt file
####Tasks
    
##### grunt debug

Use grunt debug to create the debug html file.  You only need to run this when you have added new files to
the src directories.

##### grunt build

Use grunt build to create the production html file.  We still have to copy the html file to a panel to test.

##### grunt test-fast

Use grunt test-fast to run the Jasmine tests in the fast directory.  Typically, the tests in the fast 
directory are more pure unit tests and do not need to connect to Rally.

##### grunt test-slow

Use grunt test-slow to run the Jasmine tests in the slow directory.  Typically, the tests in the slow
directory are more like integration tests in that they require connecting to Rally and interacting with
data.

##### grunt deploy

Use grunt deploy to build the deploy file and then install it into a new page/app in Rally.  It will create the page on the Home tab and then add a custom html app to the page.  The page will be named using the "name" key in the config.json file (with an asterisk prepended).

To use this task, you must create an auth.json file that contains the following keys:
{
    "username": "fred@fred.com",
    "password": "fredfredfred",
    "server": "https://us1.rallydev.com"
}

(Use your username and password, of course.)  NOTE: not sure why yet, but this task does not work against the demo environments.  Also, .gitignore is configured so that this file does not get committed.  Do not commit this file with a password in it!

When the first install is complete, the script will add the ObjectIDs of the page and panel to the auth.json file, so that it looks like this:

{
    "username": "fred@fred.com",
    "password": "fredfredfred",
    "server": "https://us1.rallydev.com",
    "pageOid": "52339218186",
    "panelOid": 52339218188
}

On subsequent installs, the script will write to this same page/app. Remove the
pageOid and panelOid lines to install in a new place.  CAUTION:  Currently, error checking is not enabled, so it will fail silently.

##### grunt watch

Run this to watch files (js and css).  When a file is saved, the task will automatically build and deploy as shown in the deploy section above.

