Ext.define('CA.agile.technicalservices.inlinefilter.UserPermissionInProject', {
    alias: 'widget.tsprojectpermissionsearchfield',
    extend: 'Rally.ui.combobox.ComboBox',
    requires: [
        'Rally.data.wsapi.Filter'
    ],

    config: {
        valueField: 'ObjectID',
        displayField: 'Name',
        emptyText: "Filter users with permissions in Project",
        labelAlign: 'right',
        allowNoEntry: true,
        width: 300,
        stateful: false
    },
    allowBlank: true,

    constructor: function(config) {

        this.mergeConfig(config);

        this.store = Ext.create('Ext.data.Store', {
            fields: [this.valueField, this.displayField],
            data: data = _.sortBy(
                Ext.Array.map(CA.technicalservices.userutilities.ProjectUtility.getAllProjects(), function(w){
                    return {
                        ObjectID: w.ObjectID,
                        Name: w.Name
                    };
                }),
                'Name'
            )
        });
        return this.callParent([this.config]);
    },

    initComponent: function(){
        this.callParent(arguments);
        if (this.value){
            this.on('ready', this.fetchFilters, this);
        }
        this.on('beforeselect', this.fetchFilters, this);
       // this.on('beforechange', this.fetchFilters, this);
    },
    fetchFilters: function(cb, record){

        console.log('here');
        
        var workspace = CA.technicalservices.userutilities.ProjectUtility.getCurrentWorkspace(),
            projectID = this.getValue();
        console.log('fetchFilters', cb, projectID);
        var promises = [
            this._fetchProjectPermissions(workspace)
        ];
        
        var old_filters = this.filters;
        
        this.filters = null;
        Deft.Promise.all(promises).then({
            success: function(results){
                var permissions = _.flatten(results);

                var filters = [{
                    property: "SubscriptionPermission",
                    value: "Subscription Admin"
                },{ //note this is for current workspace only
                    property: "WorkspacePermission",
                    value: "Workspace Admin"
                }];

                Ext.Array.each(permissions, function(r){
                    if ((r.get('Project') && r.get('Project').ObjectID === projectID) ||
                         r.get('_type') === "user"){
                        filters.push({
                            property: 'ObjectID',
                            value: r.get('User').ObjectID
                        });
                    }
                });

                if (filters.length > 1){
                    filters = Rally.data.wsapi.Filter.or(filters);
                }
                this.filters = filters;
                this.fireEvent('select', this, record);
                this.fireEvent('change', this, old_filters, this.filters);
                //this.fireEvent('filterusers',record); //filters);
            },
            scope: this
        });
        return true;
    },
    getFilters: function(){
        return this.filters || null;
    },
    getFilter: function(){
        return this.getFilters();
    },
    onListSelectionChange: function(list, selectedRecords) {
        var me = this,
            isMulti = me.multiSelect,
            hasRecords = selectedRecords.length > 0;

        // Only react to selection if it is not called from setValue, and if our list is
        // expanded (ignores changes to the selection model triggered elsewhere)
        console.log('onLIstSelectionChagne',list, selectedRecords);
        if (!me.ignoreSelection && me.isExpanded) {
            if (!isMulti) {
                Ext.defer(me.collapse, 1, me);
            }
            /*
             * Only set the value here if we're in multi selection mode or we have
             * a selection. Otherwise setValue will be called with an empty value
             * which will cause the change event to fire twice.
             */
            if (isMulti || hasRecords) {
                me.setValue(selectedRecords, false);
            }
            if (hasRecords) {
                this.fetchFilters(me, selectedRecords);
                //me.fireEvent('select', me, selectedRecords);
            }
            me.inputEl.focus();
        }
    },
    _fetchProjectPermissions: function(workspace){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store', {
            model: 'ProjectPermission',
            fetch: ['Name','Role','User','ObjectID','Workspace','Project'],
            filters: [{
                property: 'Workspace.ObjectID',
                value: workspace
            }]
        }).load({
            callback: function(records, operation){
                deferred.resolve(records);
            },
            scope: this
        });
        return deferred.promise;
    }
});