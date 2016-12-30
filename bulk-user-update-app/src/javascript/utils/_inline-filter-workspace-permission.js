Ext.define('CA.agile.technicalservices.inlinefilter.UserPermissionInWorkspace', {
    alias: 'widget.tsworkspacepermissionsearchfield',
    extend: 'Rally.ui.combobox.ComboBox',

    config: {
        valueField: 'ObjectID',
        displayField: 'Name',
        emptyText: "Filter users with permissions in Workspace",
        width: 300,
        labelAlign: 'right',
        allowNoEntry: true
    },
    allowBlank: true,

    constructor: function(config) {

        this.mergeConfig(config);

        this.store = Ext.create('Ext.data.Store', {
            fields: ['ObjectID','Name'],
            data: _.sortBy(
                Ext.Array.map(CA.technicalservices.userutilities.ProjectUtility.getAllWorkspaces(), function(w){
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
        this.on('select', this.fetchFilters, this );
    },
    fetchFilters: function(){
        Ext.create('Rally.data.wsapi.Store', {
            model: 'WorkspacePermission',
            fetch: ['Name','Role','User','ObjectID','Workspace'],
            filters: [{
                property: 'Workspace.ObjectID',
                value: this.getValue()
            }]
        }).load({
            callback: function(records, operation){
                var filters = [{
                    property: "SubscriptionPermission",
                    value: "Subscription Admin"
                }];

                Ext.Array.each(records, function(r){
                    filters.push({ property: 'ObjectID',
                        value: r.get('User').ObjectID
                    });
                });
                if (filters.length > 1){
                    filters = Rally.data.wsapi.Filter.or(filters);
                }

                this.filters = filters;
                this.fireEvent('filterusers',filters);
            },
            scope: this
        });
    },
    getFilters: function(){
        console.log('getFilters', this.filters && this.filters.toString());
        return this.filters || null;
    }


});