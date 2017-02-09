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

        var workspace = CA.technicalservices.userutilities.ProjectUtility.getCurrentWorkspace(),
            projectID = this.getValue();


        var old_filters = this.filters;

        this.filters = null;
        this._fetchProjectPermissionsEndpoint(projectID).then({
           success: function(permissions){
               var filters = Ext.Array.map(permissions, function(p){
                   var ar = p._ref.split('/');
                   var objID = ar.slice(-1)[0];
                   objID = Number(objID);

                   return {
                       property: 'ObjectID',
                       value: objID
                   };
               });

               if (filters.length > 1){
                   filters = Rally.data.wsapi.Filter.or(filters);
               }

               this.filters = filters;
               this.fireEvent('select', this, record);
               this.fireEvent('change', this, old_filters, this.filters);
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
    },
    _fetchProjectPermissionsEndpoint: function(project_oid){
        var deferred = Ext.create('Deft.Deferred');

        this._fetchProjectPermissionsPage(project_oid, 1,1).then({
            success: function(obj){
                if (!obj){
                    deferred.resolve([]);
                } else {

                    var totalCount = obj.QueryResult && obj.QueryResult.TotalResultCount || 0,
                        pageSize = 1000,
                        promises = [];

                    for (var i=0; i<totalCount; i += pageSize){
                        var start = i+ 1;
                        promises.push(this._fetchProjectPermissionsPage(project_oid, start, pageSize));
                    }
                    Deft.Promise.all(promises).then({
                        success: function(results){
                            var users = [];
                            Ext.Array.each(results, function(r){
                                users = users.concat(r.QueryResult && r.QueryResult.Results || []);
                            });
                            deferred.resolve(users);
                        }
                    });
                }
            },
            scope: this
        });
        return deferred.promise;
    },
    _fetchProjectPermissionsPage: function(project_oid, startindex, pagesize){
        var deferred = Ext.create('Deft.Deferred');

        if (!startindex){
            startindex = 1;
        }
        if (!pagesize){
            pagesize = 2000;
        }

        Ext.Ajax.request({
            url: Ext.String.format("/slm/webservice/v2.0/project/{0}/projectusers?start={2}&pagesize={1}",project_oid, pagesize, startindex),
            success: function(response){
                if (response && response.responseText){
                    var obj = Ext.JSON.decode(response.responseText);
                    deferred.resolve(obj);
                } else {
                    deferred.resolve(null);
                }
            }
        });

        return deferred.promise;
    }
});