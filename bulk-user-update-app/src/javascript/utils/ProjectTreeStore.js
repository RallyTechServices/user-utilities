Ext.define('CA.technicalservices.userutilities.ProjectUtility',{
    singleton: true,

    permissions: {
        __permissionAdmin: 'Project Admin',
        __permissionEditor: 'Editor',
        __permissionViewer: 'Viewer',
        __permissionNoAccess: 'No Access'
    },
    initialize: function(context){
        var deferred = Ext.create('Deft.Deferred');

        var promises = [
            CA.technicalservices.userutilities.ProjectUtility.fetchProjectsInWorkspace(context.getWorkspace().ObjectID),
            CA.technicalservices.userutilities.ProjectUtility.fetchWorkspacesInSubscription()
        ];

        CA.technicalservices.userutilities.ProjectUtility._parsePermissions(context);

        Deft.Promise.all(promises).then({
            success: function(results){
                CA.technicalservices.userutilities.ProjectUtility.initializeRecords(results[0]);
                CA.technicalservices.userutilities.ProjectUtility.allWorkspaces = results[1];
                deferred.resolve();
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred;
    },
    getAllWorkspaces: function(){
        return CA.technicalservices.userutilities.ProjectUtility.allWorkspaces;
    },
    getAllProjects: function(){
        //in current workspace
        return Ext.Object.getValues(CA.technicalservices.userutilities.ProjectUtility.projectHash);
    },
    getAllowedWorkspaces: function(){
        return CA.technicalservices.userutilities.ProjectUtility.allowedWorkspaces;
    },
    getCurrentWorkspace: function(){
        return CA.technicalservices.userutilities.ProjectUtility.currentWorkspace;
    },
    hasAssignUserPermissions: function(){
        return CA.technicalservices.userutilities.ProjectUtility.hasPrivileges;
    },
    _parsePermissions: function(context){

        var workspaces = [],
            subAdmin = false,
            permissions = context.getPermissions().userPermissions;

        Ext.Array.each(permissions, function(permission){
            if (permission.Role === "Subscription Admin" || permission.Role === "Workspace Admin"){
                subAdmin = (permission.Role === "Subscription Admin");
                workspaces.push(Rally.util.Ref.getOidFromRef(permission._ref));
            }
        });
        CA.technicalservices.userutilities.ProjectUtility.allowedWorkspaces = workspaces;
        CA.technicalservices.userutilities.ProjectUtility.isSubAdmin = subAdmin;
        CA.technicalservices.userutilities.ProjectUtility.currentWorkspace = context.getWorkspace().ObjectID;

        //This could change based on how we decide who can do what
        CA.technicalservices.userutilities.ProjectUtility.hasPrivileges = Ext.Array.contains(workspaces, context.getWorkspace().ObjectID);

    },
    fetchWorkspacesInSubscription: function(){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store', {
            model: 'Subscription',
            fetch: ['Workspaces','ObjectID','Name','State'], //can fetch defect fields inline
            pageSize: 1
        }).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    var subscription = records[0];
                    subscription.getCollection('Workspaces').load({
                        fetch: ['ObjectID', 'Name', 'State'],
                        filters: [{
                            property: 'State',
                            value: 'Open'
                        }],
                        callback: function(workspaces, operation) {
                            if (operation.wasSuccessful()){
                                workspaces = Ext.Array.map(workspaces, function(w){ return w.getData(); });
                                deferred.resolve(workspaces);
                            } else {
                                deferred.resolve("Error fetching Workspace information: " + operation.error.errors.join(','));
                            }
                        }
                    });
                } else {
                    deferred.resolve("Error fetching Subscription information: " + operation.error.errors.join(','));
                }
            }
        });
        return deferred.promise;
    },
    fetchProjectsInWorkspace: function(workspaceOid){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store',{
            model: 'Project',
            fetch: ['ObjectID','Name','Parent','Workspace'],
            limit: Infinity,
            context: {workspace: '/workspace/' + workspaceOid, project: null},
            compact: false,
            filters: [{
                property: 'State',
                value: 'Open'
            }],
            sorters: [{
                property: 'ObjectID',
                direction: 'ASC'
            }]
        }).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    deferred.resolve(records);
                } else {
                    deferred.reject("Error loading project structure for workspace " + workspaceOid + ": " + operation.error.errors.join(','));
                }
            }
        });
        return deferred.promise;
    },
    initializeRecords: function(records){
        var hash = {},
            rootProjects = [];

        Ext.Array.each(records, function(r){
            hash[r.get('ObjectID')] = r.getData();
            hash[r.get('ObjectID')].children = [];
        });

        Ext.Object.each(hash, function(oid, projectData){
            projectData.__projectHierarchy = CA.technicalservices.userutilities.ProjectUtility._buildProjectHierarchy(oid,hash);
            var parentID = projectData.Parent && projectData.Parent.ObjectID || null;

            if (!parentID){
                rootProjects.push(projectData);
            } else {
                var parentModel = hash[parentID];
                parentModel.children.push(projectData);
            }
        });
        CA.technicalservices.userutilities.ProjectUtility.projectHash = hash;
        CA.technicalservices.userutilities.ProjectUtility.rootProjects = rootProjects;
    },
    getProjectTreeData: function(){
        //This is an attempt to deep clone the root projects structure.
        var newRootProjects = (JSON.parse(JSON.stringify(CA.technicalservices.userutilities.ProjectUtility.rootProjects)));
        return newRootProjects; //CA.technicalservices.userutilities.ProjectUtility.rootProjects;
    },
    _buildProjectHierarchy: function(projectID, projectHash){
        var parent = projectHash[projectID].Parent && projectHash[projectID].Parent.ObjectID || null;

        var projectHierarchy = [projectID];
        if (parent){
            do {
                projectHierarchy.unshift(parent);
                parent = projectHash[parent] &&
                    projectHash[parent].Parent &&
                    projectHash[parent].Parent.ObjectID || null;

            } while (parent);
        }
        return projectHierarchy;

    },
    assignPermissions: function(userOid, permission, projectOids, forceDowngrade){
        var deferred = Ext.create('Deft.Deferred');
        forceDowngrade = forceDowngrade || false;

        var rootProjectData = CA.technicalservices.userutilities.ProjectUtility.getRootProjectData(projectOids,
            CA.technicalservices.userutilities.ProjectUtility.projectHash);

        var promises = [],
            me = this;
        Ext.Array.each(rootProjectData, function(rpd){
            promises.push(function(){
                return CA.technicalservices.userutilities.ProjectUtility._updatePermissionRootProject(userOid,rpd.rootProjectOID,rpd.excludedProjectOIDs,permission,forceDowngrade);
            })
        });

        Deft.Chain.parallel(promises).then({
            success: function(results){
                deferred.resolve(results);
            }
        });

        return deferred.promise;
    },
    _updatePermissionRootProject: function(userObjectID, rootProjectObjectID, excludedProjectIDs, permission, forceDowngrade){

        console.log('_updatePermissionRootProject', userObjectID, rootProjectObjectID, excludedProjectIDs, permission, forceDowngrade);

        var deferred = Ext.create('Deft.Deferred');
        forceDowngrade = forceDowngrade || false;

        if (Ext.isArray(excludedProjectIDs)){
            excludedProjectIDs = excludedProjectIDs.join(',');
        }

        Ext.Ajax.request({
            url: '/slm/webservice/v2.0/projectpermission/bulkupdate',
            method: 'POST',
            params: {
                "userOID" : userObjectID,
                "rootProjectOID": rootProjectObjectID,
                "excludedRootProjectOIDs": excludedProjectIDs, //comma-delimited
                "permission": permission, //No Access, Viewer, Editor, or Project Admin.
                "forceDowngradePermissions": forceDowngrade
            },
            scope:this,
            success: function(response, options){
                console.log('success', response, options);
                var result = this._parseResult(response);
                result.user = userObjectID;
                deferred.resolve(result);
            },
            failure: function(response, options){
                console.log('failed', response, options);
                var result = this._parseResult(response);
                result.user = userObjectID;
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    },
    _parseResult: function(response, options){
        var responseText = response && response.responseText,
            status = response.status,
            success = false;

        if (status === 200){
            var operationResult = Ext.JSON.decode(response.responseText);
            if (operationResult && operationResult.OperationResult && operationResult.OperationResult.Results){
                var results = operationResult.OperationResult.Results;
                if (results.length > 0){
                    responseText = results[0];
                    if (responseText === "Disabled"){
                        responseText = "This functionality is disabled for your subscription.";

                    } else {
                        success = true;
                    }
                }
            }
        }
        console.log('responseTest',responseText);
        return {success: success,
                message: responseText
        };
    },
    /**
     * getRootProjectData
     * Given an array of projects, this function takes the projects and splits them up into
     * the most efficient root structure with excluded project ids
     * excludedProjectIDs - excluded projects in the treenode
     * count - total count of projects affected
     * @param treeStore
     * @param matchFn
     * @returns {Array}
     */
    getRootProjectData: function(projects, projectHash){
        var data = [];

        Ext.Array.each(projects, function(p){
            var po = projectHash[p];
            if (!po.Parent || !Ext.Array.contains(projects, po.Parent.ObjectID)){
                data.push({
                    rootProjectOID: po.ObjectID,
                    excludedProjectOIDs: CA.technicalservices.userutilities.ProjectUtility.getExcludedProjects(po.children, projects)
                });
            }
        });
        return data;
    },
    getExcludedProjects: function(children, projects){
        var excludedProjects = [];
        Ext.Array.each(children, function(c){
            if (!Ext.Array.contains(projects, c.ObjectID)){
                excludedProjects.push(c.ObjectID);
            } else {
                excludedProjects = Ext.Array.merge(excludedProjects,
                CA.technicalservices.userutilities.ProjectUtility.getExcludedProjects(c.children, projects));
            }
        });
        return excludedProjects;
    },
    getPermission: function(permissionKey){
        return CA.technicalservices.userutilities.ProjectUtility.permissions[permissionKey] ||
            CA.technicalservices.userutilities.ProjectUtility.permissions.__permissionNoAccess;
    },
    addTeamMembership: function(userOid, projectOids){
        var deferred = Ext.create('Deft.Deferred');

        if (!this.userModel){
            Rally.data.ModelFactory.getModel({
                type: 'User',
                success: function(model) {
                    this.userModel = model;
                    this.updateTeamMembership(userOid, projectOids).then({
                        success: function(){
                            deferred.resolve({success: true, user: userOid});
                        },
                        failure: function(msg){
                            deferred.reject({success: false, message: msg, user: userOid});
                        }
                    });
                },
                scope: this
            });
        } else {
            this.updateTeamMembership(userOid, projectOids).then({
                success: function(){
                    deferred.resolve({success: true, user: userOid});
                },
                failure: function(msg){
                    deferred.reject({success: false, message: msg, user: userOid});
                }
            });
        }
        return deferred.promise;
    },
    updateTeamMembership: function(userOid, projects){
        var deferred = Ext.create('Deft.Deferred');

        this.userModel.load(userOid, {
            fetch: ['TeamMemberships'],
            callback: function(user, operation) {
                if(operation.wasSuccessful()) {
                    var teamMembershipStore = user.getCollection('TeamMemberships');
                    teamMembershipStore.load({
                        callback: function() {
                            Ext.Array.each(projects, function(project){
                                teamMembershipStore.add('/project/' + project);
                            });
                            teamMembershipStore.sync({
                                callback: function() {
                                    deferred.resolve();
                                }
                            });
                        }
                    });
                } else {
                    deferred.reject("Error retrieving user: " + operation.error.error.join(','));
                }
            }
        });
        return deferred.promise;
    }
});