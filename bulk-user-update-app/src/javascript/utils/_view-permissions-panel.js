///**
// * Created by kcorkan on 12/19/16.
// */
Ext.define('CA.technicalservices.userutilities.ViewPermissionsPanel',{
    extend: 'Ext.panel.Panel',

    itemId: 'permissionsPanel',
    autoShow: true,
    draggable: false,
    resizable: true,
    closable: true,
    collapseDirection: 'right',
    fixed: true,
    autoCenter: false,
    floating: true,
    cls: 'view-permissions',
    items: [],

    constructor: function(config){
        this.mergeConfig(config);
        this.record = config.record;

        var html = Ext.String.format('<span class="view-permissions-title"><div class="view-permissions-title"><span class="view-permissions-icon icon-user"></span><a  class="view-permissions-title" href="/#/detail/user/{0}" target="_blank">{1}</a></div></span>', this.record.get('ObjectID'), this.record.get('UserName'));
        this.closable = false;
        this.header = {
            layout: 'hbox',
            items: [{
                xtype: 'container',
                html: html,
                width: '90%'
            },{
                xtype: 'rallybutton',
                cls: 'view-permissions-close icon-cancel',
                height: 18,
                flex: 1,
                iconAlign: 'right',
                tooltipCfg:{
                    html: 'Close'
                },
                listeners: {
                    click: function() {
                        this.destroy();
                    },
                    scope: this
                }
            }]
        }

        this.callParent(arguments);
    },
    initComponent: function(){
        var message =  CA.technicalservices.userutilities.ProjectUtility.getCurrentWorkspaceName() + ' Workspace';
        this.items = [{
            xtype: 'container',
            html: '<div class="no-data-container"><div class="secondary-message">' + message + '</div></div>'
        }];

        this.callParent(arguments);

        this._buildViewPermissionStore(this.record).then({
            success: function(store){
                console.log('emptyText', this.emptyText, store);
                var grid = Ext.create('CA.technicalservices.userutilities.ProjectGrid',{
                    itemId: 'view-permissions-grid',
                    workspace: null,
                    store: store,
                    cls: 'rally-grid',
                    columns: this._getColumnCfgs(),
                    collapsed: false,
                    viewConfig: {
                        emptyText: this.emptyText
                    },
                    height: 300
                });

                this._addGrid(grid);

            },
            scope: this
        });
    },
    _addGrid: function(grid){
        if (!this.rendered){
            this.on('render', function(){ this._addGrid(grid); }, this);
            return;
        }

        this.add(grid);

        if (this.emptyText){
           this._updateEmptyText(grid);
        }
    },
    _updateEmptyText: function(grid){
        if (!grid.rendered){
            grid.on('afterrender', function(){ this._updateEmptyText(grid); }, this);
            return;
        }

        var targetEl = grid.getEl();
        var body = targetEl && targetEl.query('tbody')[0];
        if (body){
            Ext.DomHelper.insertHtml('beforeEnd', body, '<tr><td colspan="3"><div class="no-data-container"><div class="secondary-message">' + this.emptyText +'</div></div></td></tr>');
        }
    },
    _buildViewPermissionStore: function(userRecord){
            var deferred = Ext.create('Deft.Deferred');

            this.emptyText = null;

            if (userRecord.get('Disabled')){
                this.emptyText = 'The user ' + userRecord.get("UserName") + ' is disabled.';
                deferred.resolve(Ext.create('Ext.data.TreeStore', {
                    root: {
                        children: [],
                        expanded: true
                    },
                    model: 'CA.technicalservices.userutilities.ProjectModel'
                }));

            } else if (userRecord.get('SubscriptionAdmin')){

                this.emptyText = Ext.String.format("{0} is a Subscription Administrator.", userRecord.get('_refObjectName'));
                deferred.resolve(Ext.create('Ext.data.TreeStore', {
                    root: {
                        children: [],
                        expanded: true
                    },
                    model: 'CA.technicalservices.userutilities.ProjectModel'
                }));

            } else {

                var promises = [
                    CA.technicalservices.userutilities.ProjectUtility._fetchCollection(userRecord, 'UserPermissions'),
                    CA.technicalservices.userutilities.ProjectUtility._fetchCollection(userRecord, 'TeamMemberships')
                ];

                Deft.Promise.all(promises).then({
                    success: function(results){
                        var teamMembership = results[1],
                            permissions = results[0],
                            isWorkspaceAdmin = false,
                            permissionsHash = {};

                        Ext.Array.each(permissions, function(p){
                            var permissionRef = p.get('ObjectID'),
                                permissionType = p.get('_type'),
                                permissionRole = p.get('Role'),
                                permissionInfo = permissionRef.split(/[^0-9]/);

                            var containerOid = Number(permissionInfo[1]);

                            //If we are a workspace admin for the current workspace, then we need not go further
                            //   console.log('permissionType',permissionType,permissionRole,containerOid, CA.technicalservices.userutilities.ProjectUtility.getCurrentWorkspace())

                            if (permissionType === 'workspacepermission' && permissionRole === 'Admin' &&
                                containerOid === CA.technicalservices.userutilities.ProjectUtility.getCurrentWorkspace()){
                                isWorkspaceAdmin = true;
                                return false;
                            }

                            if (permissionType === 'projectpermission'){
                                permissionsHash[containerOid] = {
                                    permission: permissionRole,
                                    teamMember: false
                                }
                            }
                        });

                        Ext.Array.each(teamMembership, function(p){
                            var oid = p.get("ObjectID");
                            if (!permissionsHash[oid]){
                                permissionsHash[oid] = {
                                    permission: null
                                }
                            }
                            permissionsHash[oid].teamMember = true;
                        });

                        if (isWorkspaceAdmin){
                            this.emptyText = Ext.String.format("{0} is a Workspace Administrator in the {1} Workspace", userRecord.get('_refObjectName'),CA.technicalservices.userutilities.ProjectUtility.currentWorkspaceName);
                            deferred.resolve(Ext.create('Ext.data.TreeStore', {
                                root: {
                                    children: [],
                                    expanded: true
                                },
                                model: 'CA.technicalservices.userutilities.ProjectModel'
                            }));
                        } else if (Ext.Object.isEmpty(permissionsHash)){
                            this.emptyText = Ext.String.format("{0} has no Project Permissions in the {1} workspace", userRecord.get('_refObjectName'),CA.technicalservices.userutilities.ProjectUtility.currentWorkspaceName);
                            deferred.resolve(Ext.create('Ext.data.TreeStore', {
                                root: {
                                    children: [],
                                    expanded: true
                                },
                                model: 'CA.technicalservices.userutilities.ProjectModel'
                            }));
                        } else  {
                            //now put the projects into a tree...
                            var data = CA.technicalservices.userutilities.ProjectUtility.getProjectTreeData();

                            var store = Ext.create('Ext.data.TreeStore', {
                                root: {
                                    children: data,
                                    expanded: true
                                },
                                model: 'CA.technicalservices.userutilities.ProjectModel'
                            });

                            var projects = _.map(Ext.Object.getKeys(permissionsHash), function(k){ return Number(k); }),
                                removeNodes = [];

                            store.getRootNode().cascadeBy(function(node){
                                var oid = node.get('ObjectID');
                                if (!Ext.Array.contains(projects, oid)){
                                    removeNodes.push(node);
                                } else {
                                    if (permissionsHash[oid].teamMember){
                                        node.set('__teamMember', true);
                                    }
                                    if (permissionsHash[oid].permission === 'Viewer'){
                                        node.set('__permissionViewer', true);
                                    }
                                    if (permissionsHash[oid].permission === 'Editor'){
                                        node.set('__permissionEditor', true);
                                    }
                                    if (permissionsHash[oid].permission === 'Admin'){
                                        node.set('__permissionAdmin', true);
                                    }
                                }
                            });

                            Ext.Array.each(removeNodes, function(rm){
                                rm.remove();
                            });
                            if (store.getRootNode().hasChildNodes()){
                                store.getRootNode().expand(true);
                            } else {
                                this.emptyText = Ext.String.format("{0} has no Project Permissions in the {1} workspace", userRecord.get('_refObjectName'),CA.technicalservices.userutilities.ProjectUtility.currentWorkspaceName);

                            }
                            deferred.resolve(store);
                        }


                    },
                    failure: function(msg){
                        this.emptyText = 'Error loading user permissions: ' + msg;
                        deferred.resolve(Ext.create('Ext.data.TreeStore', {
                            root: {
                                children: [],
                                expanded: true
                            },
                            model: 'CA.technicalservices.userutilities.ProjectModel'
                        }));
                    },
                    scope: this
                });
            }
            return deferred.promise;
    },
    _getColumnCfgs: function(){

        return [{
            xtype: 'treecolumn',
            text: 'Project',
            menuDisabled: true,
            dataIndex: 'Name',
            flex: 1
        },{
            text: 'Permission',
            dataIndex: '__permissionViewer',
            align: 'center',
            renderer: this.permissionRenderer
        },{
            text: 'Team Member',
            dataIndex: '__teamMember',
            align: 'center',
            renderer: this.teamMemberRenderer
        }];

    },

    permissionRenderer: function(v,m,r){
        if (r.get('__permissionViewer')){
            return 'Viewer';
        }
        if (r.get('__permissionEditor')){
            return 'Editor';
        }
        if (r.get('__permissionAdmin')){
            return 'Admin';
        }
        return '';
    },
    teamMemberRenderer: function(v, m, r){
        if (v){
            return '<div class="icon-ok"></div>';
        }
        return '';
    }

});