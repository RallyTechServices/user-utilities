Ext.define('CA.technicalservices.userutilities.dialog.ProjectPermissions', {
    extend:'Rally.ui.dialog.Dialog',

  //  cls: 'field-picker-btn secondary rly-small',

    autoShow: true,
    draggable: true,
    width: 800,
    height: 400,
    closable: true,
    items: [],

    beforeRender: function() {
        this.callParent(arguments);
        var me = this;

        this.addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            padding: '0 0 10 0',
            layout: {
                type: 'hbox',
                pack: 'center'
            },
            ui: 'footer',
            items: [
                {
                    xtype: 'rallybutton',
                    itemId: 'doneButton',
                    text: this.goText,
                    cls: 'primary rly-small',
                    userAction: 'clicked apply in dialog',
                    handler: function() {
                        me.fireEvent('updated', me, me.selectedCache || {});
                        me.close();
                        me.destroy();
                    },
                    scope: this
                },
                {
                    xtype: 'rallybutton',
                    text: 'Cancel',
                    cls: 'secondary rly-small',
                    handler: this.close,
                    scope: this,
                    ui: 'link'
                }
            ]
        });

        this.projectGrid= Ext.create('CA.technicalservices.userutilities.ProjectGrid',{
            workspace: null,
            height: 300,
            columns: this._getColumnCfgs(),
            itemId: 'project-grid',
            listeners: {
                cellclick: this.updateToggles,
                scope: this
            },
            store: this._createStore()
        });
        this.add(this.projectGrid);
    },
    updateToggles: function(view, cell, cellIndex,record){
        var clickedDataIndex = view.panel.headerCt.getHeaderAtIndex(cellIndex).dataIndex;
        var value = record.get(clickedDataIndex);
        var oid = record.get('ObjectID');

        if (clickedDataIndex && /__permission/.test(clickedDataIndex)){
            record.set('__permissionAdmin', false);
            record.set('__permissionEditor', false);
            record.set('__permissionViewer', false);
            if (!value){
                record.set(clickedDataIndex, true);
                this.updateCache(clickedDataIndex, oid, true);
            } else {
                this.updateCache(clickedDataIndex, oid, false);
            }
            this.updateRecordChildrenPermissions(record,clickedDataIndex, !value);
            record.expand(true);
        }
        if (clickedDataIndex === '__teamMember'){
            record.set('__teamMember',!value);
            this.updateRecordChildrenField(record, !value, '__teamMember');
            this.updateCache(clickedDataIndex, oid, !value);
            record.expand(true);
        }
        if (clickedDataIndex === '__permissionNone'){
            record.set('__permissionNone',!value);
            this.updateRecordChildrenField(record, !value,'__permissionNone');
            this.updateCache(clickedDataIndex, oid, !value);
            record.expand(true);
        }
    },
    updateRecordChildrenField: function(record, value, fieldName){
        var children = record.childNodes || [];
        Ext.Array.each(children, function(child){
            child.set(fieldName, value);
            this.updateCache(fieldName, child.get('ObjectID'), value);
            this.updateRecordChildrenField(child, value);
        }, this);
    },
    updateCache: function(fieldName, oid, booleanFlag){
        if (!this.selectedCache){
            this.selectedCache = {};
        }

        //First remove from all caches
        Ext.Object.each(this.selectedCache, function(f,cache){
            var idx = _.indexOf(cache, oid)
            if (idx >= 0){
                cache.splice(idx, 1);
            }
        });

        if (booleanFlag){
            if (!this.selectedCache[fieldName]){
                this.selectedCache[fieldName] = [];
            }
            this.selectedCache[fieldName].push(oid);
        }

    },
    updateRecordChildrenPermissions: function(record, clickedDataIndex, value){
        var children = record.childNodes || [];

        Ext.Array.each(children, function(child){
            child.set('__permissionAdmin', false);
            child.set('__permissionEditor', false);
            child.set('__permissionViewer', false);
            child.set(clickedDataIndex,value);
            this.updateCache(clickedDataIndex,child.get('ObjectID'),value);
            this.updateRecordChildrenPermissions(child, clickedDataIndex, value);
        }, this);
    },
    _getColumnCfgs: function(){
        var permissionWidth = 75;
        var buttonHeight = 20,
            me = this;

        var columns = [{
                xtype: 'treecolumn',
                text: 'Project',
                menuDisabled: true,
                dataIndex: 'Name',
                flex: 1
            }];

        if (this.type === 'assignPermissions'){
            columns = columns.concat([{
                text: 'Viewer',
                dataIndex: '__permissionViewer',
                align: 'center',
                renderer: function(v,m,r){
                    var tpl = Ext.create('Rally.ui.renderer.template.ToggleButtonTemplate');
                    return tpl.apply(v);
                }
            },{
                text: 'Editor',
                dataIndex: '__permissionEditor',
                align: 'center',
                renderer: function(v,m,r){
                    var tpl = Ext.create('Rally.ui.renderer.template.ToggleButtonTemplate');
                    return tpl.apply(v);
                }
            },{
                text: 'Admin',
                dataIndex: '__permissionAdmin',
                align: 'center',
                renderer: function(v,m,r){
                    var tpl = Ext.create('Rally.ui.renderer.template.ToggleButtonTemplate');
                    return tpl.apply(v);
                }
            }]);
        }

        if (this.type === 'teamMembership'){
            columns = columns.concat([{
                text: 'Team Member',
                dataIndex: '__teamMember',
                align: 'center',
                renderer: function (v, m, r) {
                    var tpl = Ext.create('Rally.ui.renderer.template.ToggleButtonTemplate');
                    return tpl.apply(v);
                }
            }]);
        }

        if (this.type === 'removeAccess'){
            columns = columns.concat([{
                text: 'Remove Access',
                dataIndex: '__permissionNone',
                align: 'center',
                renderer: function (v, m, r) {
                    var tpl = Ext.create('Rally.ui.renderer.template.ToggleButtonTemplate');
                    return tpl.apply(v);
                }
            }]);
        }

        return columns;

    },
    _createStore: function(records){

        var root = CA.technicalservices.userutilities.ProjectUtility.getProjectTreeData();
        return Ext.create('Ext.data.TreeStore', {
            root: {
                children: root,
                expanded: false
            },
            model: 'CA.technicalservices.userutilities.ProjectModel'
        });
    },
    destroy: function(){
        if (this.projectGrid){
            this.projectGrid.destroy();
        }
        this.callParent(arguments);
    },
    toggleRenderer: function(v,m,r){
        if (CA.technicalservices.userutilities.ProjectUtility.hasAssignUserPermissions(r.get('ObjectID'))){
            var tpl = Ext.create('Rally.ui.renderer.template.ToggleButtonTemplate');
            return tpl.apply(v);
        }
        return '';
    }



});