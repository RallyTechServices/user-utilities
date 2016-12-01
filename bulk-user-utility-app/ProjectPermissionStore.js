Ext.create('CA.technicalservices.userutilities.ProjectPermissionStore',{
    extend: 'Ext.data.TreeStore',

    load: function(options){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store',{
            model: 'Project',
            fetch: ['ObjectID','Name','Parent'],
            filters: [{
                property: 'State',
                value: 'Open'
            }],
            limit: 'Infinity',
            pageSize: 2000
        }).load({
            callback: function(records, operation,success){
                if (operation.wasSuccessful()){
                    var models = this._buildProjectRecords(records);
                    deferred.resolve(models);
                } else {
                    deferred.reject("Error loading project story: " + operation.error.errors.join(','));
                }
            },
            scope: this
        });
        return deferred;
    },
    _buildProjectRecords: function(records){

    }
});