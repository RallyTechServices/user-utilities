Ext.define('CA.technicalservices.userutilities.ListFilterPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.listfilterpanel',

    cls: 'inline-filter-panel',
    flex: 1,
    header: false,
    minHeight: 46,
    padding: '8px 0 0 0',
    bodyPadding: '7px 5px 5px 5px',
    collapseDirection: 'top',
    collapsible: true,
    animCollapse: false,
    stateful: true,
    stateId: 'listFilterPanel',

    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },

    initComponent: function() {
        this.callParent(arguments);

        if (!this.stateful || (this.stateful && !this._hasState())) {
            this.applyState({});
        }

    },
    _hasState: function(){
        if (this.stateful && this.stateId) {
            return !!Ext.state.Manager.get(this.stateId);
        }
        return false;
    },
    //_loadModels: function(state){
    //    if (this.models){
    //        this._addItems(state);
    //        return;
    //    }
    //
    //    if (this.context && this.modelNames && this.modelNames.length > 0){
    //        Rally.data.ModelFactory.getModels({
    //            types: this.modelNames,
    //            context: this.context,
    //            success: function(models){
    //                this.models = models;
    //                this._addItems(state);
    //            },
    //            scope: this
    //        });
    //    }
    //},
    _addItems: function(state){
        if (!state){
            state = {};
        }

        this.removeAll();

        this.add({
            xtype: 'rallybutton',
            cls: 'inline-filter-panel-close icon-cross',
            height: 18,
            userAction: 'Close (X) filter panel clicked',
            listeners: {
                click: function() {
                    this.collapse();
                },
                scope: this
            }
        });

        var users = "";
        if (state.users && state.users.length > 0){
            users = state.users.join(',');
        }
        this.add({
            xtype: 'textarea',
            itemId: 'listBox',
            flex: 1,
            width: '90%',
            emptyText: 'Paste or type comma, space, tab or return delimited field values here...',
            labelAlign: 'top',
            margin: '0 20 5 20',
            fieldLabel: 'Filter UserNames:',
            height: 100,
            autoScroll: true,
            value: users
        });


        this.add({
            xtype: 'container',
            layout: 'hbox',
            items: [{
                xtype: 'rallybutton',
                text: 'Apply',
                margin: '5 5 20 20',
                listeners: {
                    click: this.updateListItems,
                    scope: this
                }
            },{
                xtype: 'rallybutton',
                text: 'Clear',
                margin: '5 5 20 5',
                listeners: {
                    click: this.clearListItems,
                    scope: this
                }
            }]
        });
    },
    clear: function(){
        this._getListBox().setValue('');
    },
    _getListBox: function(){
        return this.down('#listBox');
    },
    getState: function(){
        var currentState = this.getListItems();
        if (currentState.listItems && Ext.isArray(currentState.listItems)){
            currentState.listItems = currentState.listItems.join(',');
        }
        return currentState;
    },
    applyState: function(state){
        if (state && state.listItems && !Ext.isArray(state.listItems)){
            state.listItems = state.listItems.split(',');
        }
        this._addItems(state);
    },
    getListItems: function(){
        var listItems = this._getListBox().getValue();
        if (!listItems || listItems.length === 0){
            return [];
        }
        listItems = listItems.replace(/[,"\s]{1,}/g, ",");
        return listItems.split(',') || [];
    },
    updateListItems: function(){
        this.saveState();
        if (this.getListItems().length > 0){
            this.fireEvent('listitemsupdated', this.getListItems());
        } else {
            this.fireEvent('listitemsupdated', []);
        }
    },
    clearListItems: function(){
        this._getListBox().setValue(null);
        this.updateListItems();
    }

});