Ext.define('CA.technicalservices.userutilities.UserListFilterButton', {
    extend: 'Rally.ui.Button',
    alias: 'widget.listfilterbutton',

    cls: 'secondary rly-small',
    iconCls: 'icon-users',

    stateful: true,
    stateId: 'userListFilterButton',
    stateEvents: ['expand', 'collapse', 'listupdated'],
    text: '',

    config: {
        context: undefined,
        modelNames: undefined,
        toolTipConfig: {
            anchor: 'top',
            mouseOffset: [-9, -2]
        }
    },

    initComponent: function() {
        this.callParent(arguments);

        if (!this.stateful || (this.stateful && !this._hasState())) {
            this.applyState({});
        }

        this.on('click', this._togglePanel, this, { buffer: 200 });
        this.on('listitemsupdated', this._onPanelChange, this, { buffer: 500 });
        this.on('collapse', this._onCollapse, this);
    },
    _hasState: function(){
        if (this.stateful && this.stateId) {
            return !!Ext.state.Manager.get(this.stateId);
        }
        return false;
    },
    _onPanelChange: function(){

        Ext.suspendLayouts();
        if (this.getItems() && this.getItems().length > 0) {
            this.setText(Ext.String.format('{0} List Items',this.getItems().length));
            this._indicateActiveFilterPresent();
        } else {
            this.setText('');
            this._indicateNoActiveFilterPresent();
        }
        Ext.resumeLayouts(false);
        this.fireEvent('listupdated',  this.getItems());
    },
    hasUsers: function(){
        return this.getListItems().length > 0;
    },
    getItems: function(){
        return this.userListPanel && this.userListPanel.getListItems() || [];
    },
    getItemField: function(){
        return 'UserName';
    },
    afterRender: function() {
        this.callParent(arguments);
        this.toolTip.on('beforeshow', this._onBeforeShowToolTip, this);
    },
    getState: function() {
        if (this.userListPanel) {
            var state = this.userListPanel.getListItems();
            state.collapsed = this.userListPanel.getCollapsed();
            return state;
        } else {
            return Ext.state.Manager.get(this.stateId);
        }
    },
    applyState: function(state) {
        //console.log('applyState', state);
        this._build(state);
    },

    onDestroy: function() {
        _.invoke(_.compact([
            this.relayedEvents,
            this.userListPanel
        ]), 'destroy');
        this.callParent(arguments);
    },

    clearAllFilters: function() {
        if (this.userListPanel){
            this.userListPanel.clear();
        }
    },

    _build: function(applyParameters) {
        if (!this.userListPanel){
            this.userListPanel = Ext.widget({
                xtype: 'listfilterpanel',
                context: this.context,
                collapsed: true,
                flex: 1
            });
            this.relayedEvents = this.relayEvents(this.userListPanel, ['expand', 'collapse', 'listitemsupdated','panelresize', 'parametersupdated']);
            this.fireEvent('listready', this.userListPanel);
        }
        if (applyParameters) {
            this._applyParameters();
        }
    },
    _applyParameters: function(){
        // console.log('_applyParameters', params);
    },
    _indicateActiveFilterPresent: function() {
        if (!this.hasCls('primary')) {
            this.addCls('primary');
            this.removeCls('secondary');
        }
    },
    _indicateNoActiveFilterPresent: function() {
        if (!this.hasCls('secondary')) {
            this.addCls('secondary');
            this.removeCls('primary');
        }
    },
    _togglePanel: function() {
        if (this.userListPanel){
            this.userListPanel.toggleCollapse();
        }
    },
    collapse: function() {
        if (this.userListPanel){
            this.userListPanel.collapse();
        }
    },
    _onBeforeShowToolTip: function() {
        var action = this.userListPanel && this.userListPanel.collapsed ? 'Show' : 'Hide' || "Toggle";
        this.toolTip.update(Ext.String.format('{0} User Filter List', action));
    },
    _onCollapse: function() {
        console.log('_onCollapse validate here?');
    },
});