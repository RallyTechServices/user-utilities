
Ext.override(Rally.ui.inlinefilter.InlineFilterButton,{
    getUserPermissionInWorkspace: function() {
        return this.inlineFilterPanel.getUserPermissionInWorkspace();
    }
});

Ext.override(Rally.ui.inlinefilter.InlineFilterPanel,{
    getUserPermissionInWorkspace: function() {
        return this.quickFilterPanel.getUserPermissionInWorkspace();
    }
});

Ext.override(Rally.ui.inlinefilter.InlineFilterButton,{
    getUserPermissionInProject: function() {
        return this.inlineFilterPanel.getUserPermissionInProject();
    }
});

//Ext.override(Rally.ui.inlinefilter.InlineFilterPanel,{
//    getUserPermissionInProject: function() {
//        return this.quickFilterPanel.getUserPermissionInProject();
//    },
//    _onQuickFilterChange: function() {
//        console.log('_onQuickFilterChange')
//        this.quickFilterPanel.updateFilterIndices();
//        this.advancedFilterPanel.updateFilterIndices(this._getFilterStartIndex());
//        this.fireEvent('filterchange', this);
//    }
//});

Ext.override(Rally.ui.inlinefilter.FilterFieldFactory, {
    UserPermissionInWorkspace: {
        xtype: 'tsworkspacepermissionsearchfield',
        allowNoEntry: false,
        width: 300
    },
    UserPermissionInProject: {
        xtype: 'tsprojectpermissionsearchfield',
        allowNoEntry: false,
        width: 300
    }
});

Ext.override(Rally.ui.inlinefilter.QuickFilterPanel,{
    getUserPermissionInWorkspace: function() {
        var modelTypePicker = _.find(this.fields, {name: 'UserPermissionInWorkspace'});
        return modelTypePicker ? modelTypePicker.getValue() : [];
    },
    getUserPermissionInProject: function() {
        var modelTypePicker = _.find(this.fields, {name: 'UserPermissionInProject'});
        return modelTypePicker ? modelTypePicker.getValue() : [];
    },
    _onAddQuickFilterClick: function() {
        var addQuickFilterConfig = Ext.clone(this.addQuickFilterConfig);
        var blackList =  _.map(this.fields, 'name');

        if (addQuickFilterConfig && addQuickFilterConfig.whiteListFields) {
            addQuickFilterConfig.whiteListFields = _.reject(this.addQuickFilterConfig.whiteListFields, function(field){
                return _.contains(blackList, field);
            });
        }
        // break out additional fields so they can be configured
        var additionalFields = [
            {
            //    name: 'UserPermissionInWorkspace',
            //    displayName: 'Has Permissions in Workspace'
            //},{
                name: 'UserPermissionInProject',
                displayName: 'Has Permissions in Project'
            }
        ];
        if (addQuickFilterConfig && addQuickFilterConfig.additionalFields) {
            additionalFields = _.reject(this.additionalFields, function(field){
                return _.contains(blackList, field.name);
            });
        }

        this.addQuickFilterPopover = Ext.create('Rally.ui.popover.FieldPopover', {
            target: this.addQuickFilterButton.getEl(),
            placement: ['bottom', 'top', 'left', 'right'],
            fieldComboBoxConfig: _.merge({
                model: this.model,
                context: this.context,
                emptyText: 'Search filters...',
                additionalFields: additionalFields,
                blackListFields: blackList,
                listeners: {
                    select: function(field, value) {
                        console.log('select', field, value);
                        var fieldSelected = value[0].raw;
                        this.recordAction({
                            description: 'quick filter added',
                            miscData: {
                                field: fieldSelected.name || fieldSelected
                            }
                        });
                        this.addQuickFilterPopover.close();
                        this._onAddQuickFilterSelect(fieldSelected);
                    },
                    destroy: function(){
                        delete this.addQuickFilterPopover;
                    },
                    scope: this
                }
            }, addQuickFilterConfig, function(a, b) {
                if (_.isArray(a)) {
                    return a.concat(b);
                }
            })
        });
    },
    getFilters: function() {
        var filters = [];
        console.log('getFilters', this.fields);
        _.each(this.fields, function(field, index) {
            if (field.name === 'ModelType') {
                return;
            }
            console.log('getFilters field.lastValue', field.lastValue, field.hasActiveError());
            if (!Ext.isEmpty(field.lastValue) && !field.hasActiveError()) {

                var lastValue = field.lastValue;

                var isRefUri = Rally.util.Ref.isRefUri(lastValue);
                var isRefOid = _.isNumber(Rally.util.Ref.getOidFromRef(lastValue));
                if (isRefUri && isRefOid && field.valueField === '_ref' && field.noEntryValue !== lastValue) {
                    var record = field.getRecord();
                    console.log('getFilters field record', record);
                    if (record) {
                        var uuidRef = record.get('_uuidRef');
                        if (uuidRef) {
                            lastValue = uuidRef;
                        }
                    }
                }

                console.log('getFilters field name', field.name);
                var filter = _.isFunction(field.getFilter) ? field.getFilter() : Rally.data.wsapi.Filter.fromExtFilter({
                    property: field.name,
                    operator: field.operator,
                    value: lastValue
                });

                if(filter) {

                    if (field.allowNoEntry && field.noEntryValue === lastValue) {
                        filter.value = null;
                    }

                    Ext.apply(filter, {
                        name: field.name,
                        rawValue: lastValue,
                        filterIndex: index + 1
                    });

                    filters.push(filter);
                }
            }
        }, this);
        console.log('getFilters end', filters);
        return filters;
    },
});

Ext.override(Rally.ui.inlinefilter.InlineFilterButton, {
    applyState: function(state) {
        console.log('state', state);
        Ext.merge(this, this._transformStateToConfig(state));
        this._build(true);
    },
    _applyFilters: function() {
        this._updateCount();
        console.log('this.getFilters', this.getFilters());
        this.fireEvent('inlinefilterchange', this);
        this._previousTypesAndFilters = this.getTypesAndFilters();
    },
    saveState: function() {
        this.callParent(arguments);
        console.log('saveState', this.getState());
        Ext.merge(this, this._transformStateToConfig(this.getState()));
    },
    _transformStateToConfig: function(state) {
        var config = {
            inlineFilterPanelConfig: {
                collapsed: state.collapsed,
                quickFilterPanelConfig: {
                    matchType: state.matchType,
                    initialTypes: state.types,
                    initialFilters: state.quickFilters,
                    fields: state.quickFilterFields
                },
                advancedFilterPanelConfig: {
                    collapsed: state.advancedCollapsed,
                    advancedFilterRowsConfig: {
                        matchType: state.matchType,
                        initialFilters: state.advancedFilters
                    },
                    customFilterConditionConfig: {
                        value: state.condition,
                        validator: Ext.bind(this._validateCustomFilterCondition, this)
                    },
                    matchTypeConfig: {
                        value: state.matchType
                    }
                }
            }
        };

        // because state always wins, and we don't want to overwrite defaults with an undefined
        return this._removeUndefined(config);
    },
    getState: function() {
        if (this.inlineFilterPanel) {
            return {
                collapsed: this.inlineFilterPanel.getInlineCollapsed(),
                advancedCollapsed: this.inlineFilterPanel.getAdvancedCollapsed(),
                types: _.map(this.inlineFilterPanel.getTypes(), function(type) {
                    return this.model.getArtifactComponentModel(type).typeDefinition._refObjectUUID;
                }, this),
                quickFilters: this._mapFilterNamesToUuids(this.inlineFilterPanel.getQuickFilters()),
                advancedFilters: this._mapFilterNamesToUuids(this.inlineFilterPanel.getAdvancedFilters()),
                condition: this.inlineFilterPanel.getCustomFilterCondition(),
                matchType: this.inlineFilterPanel.getMatchType(),
                quickFilterFields: this._mapFieldNamesToUuids(this._getQuickFilterFields())
            };
        } else {
            return Ext.state.Manager.get(this.stateId);
        }
    },


    _updateCount: function() {
        var filterCount = this.getFilterCount();

        Ext.suspendLayouts();
        if (filterCount > 0) {
            this.setText(Ext.String.format('{0} Filter{1} Active', filterCount, filterCount > 1 ? 's' : ''));
            this._indicateActiveFilterPresent();
        } else {
            this.setText('');
            this._indicateNoActiveFilterPresent();
        }
        Ext.resumeLayouts(false);
    },
    _onModelLoadSuccess: function(applyFilters) {

        this._mapUuidsToNames();
        this._removeInvalidFilters();
        this._createInlineFilterPanel();

        if (applyFilters) {
            this._applyFilters();
        }
    },
    _createFields: function() {
        var filterIndex = 0,
            initialValues = _.indexBy(this.initialFilters, 'name');
        console.log('_createFields', this.initialFilters);
        Ext.merge(initialValues, {
            ModelType: {
                rawValue: this.initialTypes
            }
        });

        this.fields = _.map(this.fields.length ? this.fields : this.defaultFields, function(field) {
            filterIndex++;
            return this._createField(filterIndex, field, initialValues);
        }, this);
    },
    getState: function() {
        if (this.inlineFilterPanel) {
            console.log('getState', this.inlineFilterPanel.getQuickFilters());
            return {
                collapsed: this.inlineFilterPanel.getInlineCollapsed(),
                advancedCollapsed: this.inlineFilterPanel.getAdvancedCollapsed(),
                types: _.map(this.inlineFilterPanel.getTypes(), function(type) {
                    return this.model.getArtifactComponentModel(type).typeDefinition._refObjectUUID;
                }, this),
                quickFilters: this._mapFilterNamesToUuids(this.inlineFilterPanel.getQuickFilters()),
                advancedFilters: this._mapFilterNamesToUuids(this.inlineFilterPanel.getAdvancedFilters()),
                condition: this.inlineFilterPanel.getCustomFilterCondition(),
                matchType: this.inlineFilterPanel.getMatchType(),
                quickFilterFields: this._mapFieldNamesToUuids(this._getQuickFilterFields())
            };
        } else {
            return Ext.state.Manager.get(this.stateId);
        }
    },
});
