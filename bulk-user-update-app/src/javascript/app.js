Ext.define("bulk-user-update-app", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    integrationHeaders : {
        name : "bulk-user-update-app"
    },

    launch: function() {
        this.allowedWorkspaces = this._checkUserPermissions();
        this.logger.log('launch UserPermissions', this.allowedWorkspaces);

        if (!this.allowedWorkspaces || this.allowedWorkspaces.length === 0){
            this.addMessageToApp("Workspace Admin or higher privileges are required to assign user permissions.");
            return;
        }

        if (!Ext.Array.contains(this.allowedWorkspaces, this.getContext().getWorkspace().ObjectID)){
            this.addMessageToApp("Workspace Admin privileges for the currently selected workspace are required to assign bulk user permissions.");
            return;
        }

        CA.technicalservices.userutilities.ProjectUtility.initialize().then({
            success: function(){
                this._addBoxes();

                this._addSelectorComponents();

                this.buildGrid();
            },
            failure: this.showErrorNotification,
            scope: this
        });

    },
    addMessageToApp: function(message){
        this.removeAll();
        var ct = this.add({
            xtype: 'container',
            html: '<div class="no-data-container"><div class="secondary-message">' + message + '</div></div>'
        });
    },
    _checkUserPermissions: function(){
        this.logger.log('_loadUserPermissions', this.getContext().getPermissions());
        var workspaces = [],
            subAdmin = false;

        Ext.Array.each(this.getContext().getPermissions().userPermissions, function(permission){
            if (permission.Role === "Subscription Admin" || permission.Role === "Workspace Admin"){
                subAdmin = (permission.Role === "Subscription Admin");
                workspaces.push(Rally.util.Ref.getOidFromRef(permission._ref));
            }
        });
        return workspaces;
    },
    _addSelectorComponents: function(){
        this.getSelectorBox().removeAll();

        var fp = this.getSelectorBox().add({
            xtype: 'fieldpickerbutton',
            modelNames: ['User'],
            context: this.getContext(),
            margin: '10 5 10 5',
            stateful: true,
            stateId: 'grid-columns'
        });
        fp.on('fieldsupdated', this.updateStoreFields, this);

        this.getSelectorBox().add({
            xtype: 'rallyinlinefilterbutton',
            modelNames: ['User'],
            context: this.getContext(),
            margin: '10 5 10 5',

            stateful: true,
            stateId: 'grid-filters-1',
            listeners: {
                inlinefilterready: this.addInlineFilterPanel,
                inlinefilterchange: this.updateGridFilters,
                scope: this
            }
        });

        this.getSelectorBox().add({
            xtype: 'listfilterbutton',
            context: this.getContext(),
            margin: '10 5 10 5',
            listeners: {
                scope: this,
                listready: this.addListFilterPanel,
                listupdated: this.updateGridFilters
            }
        });

    },
    addListFilterPanel: function(panel){
        this.getListFilterBox().add(panel);
    },
    updateStoreFields: function(fields){
        //console.log('updateStoreFields', fields)
        this.getGrid().reconfigureWithColumns(fields);
    },
    updateGridFilters: function(filter){
        console.log('updateGridFilters', filter);
        // this._gridConfig.filters = filter.getTypesAndFilters();
        this.getSelectorBox().doLayout();
        this.buildGrid();
    },
    getFilterListButton: function(){
        return this.down('listfilterbutton');
    },
    getFilters: function(){
        var items = this.getFilterListButton() && this.getFilterListButton().getItems(),
            field = this.getFilterListButton() && this.getFilterListButton().getItemField(),
            filters = null;

        if (items && items.length > 0){
            filters = _.map(items, function(i){
                return {
                    property: field,
                    value: i
                };
            });
            filters = Rally.data.wsapi.Filter.or(filters);
        }

        // var advancedFilters = this.down('rallyinlinefilterbutton').getWsapiFilter();
        var filterButton = this.down('rallyinlinefilterbutton');
        if (filterButton && filterButton.inlineFilterPanel && filterButton.getWsapiFilter()){
            console.log('advancedfilters', filterButton.getWsapiFilter(), filterButton.getFilters());
            if (filters){
                filters = filters.and(filterButton.getWsapiFilter());
            } else {
                filters = filterButton.getWsapiFilter();
            }

        }
        return filters || [];
    },
    addInlineFilterPanel: function(panel){
        this.getAdvancedFilterBox().add(panel);
    },
    buildGrid: function(){
        this.getGridBox().removeAll();

        var grid = Ext.create('CA.technicalservices.userutilities.UserGrid',{
            columnCfgs: this.down('fieldpickerbutton').getFields() || undefined,
            storeConfig: {
                filters: this.getFilters(),
                enablePostGet: false
            },
            //listeners: {
            //    beforeaction: function(){
            //        this.setLoading("Updating...");
            //    },
            //    actioncomplete: function(){
            //        this.setLoading(false);
            //    },
            //    scope: this
            //}

        });
        this.getGridBox().add(grid);
    },
    _addBoxes: function(){
        this.removeAll();

        this.add({
            xtype: 'container',
            itemId: 'selectorBox',
            layout: 'hbox'
        });

        this.add({
            xtype:'container',
            itemId: 'advancedFilterBox',
            flex: 1
        });

        this.add({
            xtype:'container',
            itemId: 'listFilterBox',
            flex: 1
        });

        this.add({
            xtype:'container',
            itemId: 'gridBox'
        });
    },
    getGrid: function(){
        return this.down('rallygrid');
    },
    getGridBox: function(){
        return this.down('#gridBox');
    },
    getSelectorBox: function(){
        return this.down('#selectorBox');
    },
    getListFilterBox: function(){
        return this.down('#listFilterBox');
    },
    getAdvancedFilterBox: function(){
        return this.down('#advancedFilterBox');
    },
    showErrorNotification: function(msg){
        Rally.ui.notify.Notifier.showError({message: msg });
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    }
});
