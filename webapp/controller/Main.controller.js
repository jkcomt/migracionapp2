sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/Dialog",
    "sap/ui/core/IconPool"
], (Controller,JSONModel, Fragment, Filter, FilterOperator,Button,mobileLibrary,Dialog,IconPool) => {
    "use strict";

    // shortcut for sap.m.ButtonType
	var ButtonType = mobileLibrary.ButtonType;

	// shortcut for sap.m.DialogType
	var DialogType = mobileLibrary.DialogType;

    return Controller.extend("cl.copec.migrationapp.migrationapp.controller.Main", {
        onInit() {
            this.onReadParams();
        },

        onIdCargaValueHelp: function () {
            if (!this._oIdCargaDialog) {
                this._oIdCargaDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "cl.copec.migrationapp.migrationapp.view.fragments.IdCargaValueHelp",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }
            this._oIdCargaDialog.then(function (oDialog) {
                
                var oTable = this.byId("idCargaTable");
                if (oTable) {
                    oTable.getBinding("items").filter([]);
                }
                var oSearchField = this.byId("idCargaSearchField");
                if (oSearchField) {
                    oSearchField.setValue("");
                }
                oDialog.open();
            }.bind(this));
        },

        onValueHelpItemPress: function (oEvent) {
            var oData = oEvent.getSource().getBindingContext("oMainModel").getObject();
            this.setCargaValuesToInput(oData);
            this.onValueHelpCancel();
        },

        setCargaValuesToInput: function (oData) {
            this.byId("idCargaInput").setValue(oData.UploadUuid);
            this.byId("fechaCargaInput").setValue(oData.LocalCreatedAt.split("T")[0].split("-").reverse().join("-"));
            this.byId("usuarioSelect").setValue(oData.LocalCreatedBy);
            this.byId("estadoSelect").setValue(oData.Status);
            this.onGetLogValues(oData);
        },

        onGetLogValues: async function (oData) {
            var sIdCarga,sLocalCreatedAt,sUsuarioSelected,sEstadoSelect,nDateValue;
            var that = this;
            if(oData.UploadUuid){
                sIdCarga = oData.UploadUuid;
            }else{
                return;
            }

            if(oData.LocalCreatedAt){
                sLocalCreatedAt = new Date(oData.LocalCreatedAt);
                nDateValue = new Date(sLocalCreatedAt);
                nDateValue.setDate(nDateValue.getDate() + 1);
            }

            if(oData.LocalCreatedBy){
                sUsuarioSelected = oData.LocalCreatedBy;                
            }

            if(oData.Status){
                sEstadoSelect = oData.Status;
            }

            const oMainModel = this.getOwnerComponent().getModel("oMainModel");

            try {

                const aFilters =[
                    new Filter("IdCarga", FilterOperator.EQ, sIdCarga),
                    new Filter("HasDraftEntity", FilterOperator.EQ, false)
                    // new Filter({filters: [
                    //     new Filter("LocalCreatedAt", FilterOperator.GE, sLocalCreatedAt.toISOString()),
                    //     new Filter("LocalCreatedAt", FilterOperator.LT, nDateValue.toISOString())
                    // ], and: true}),
                    // new Filter("LocalCreatedBy", FilterOperator.EQ, sUsuarioSelected),                    
                    // new Filter("MStatus", FilterOperator.EQ, sEstadoSelect),
                ];

                const oListBinding = oMainModel.bindList("/DataExcel", null, null, aFilters);

                const aContexts = await oListBinding.requestContexts();

                const aData = aContexts.map(oContext => oContext.getObject());

                const oDataModel = new JSONModel(aData);
                this.getView().setModel(oDataModel, "oFilteredData");

            } catch (oError) {
                that.onMessageDialogPress("Error al leer producto: " + oError.message);
            }

        },

        onValueHelpCancel: function () {
            this.byId("idCargaValueHelpDialog").close();
        },

        onBuscar: function () {
            var oTable = this.byId("idCargaTable");
            var sSearchValue = this.byId("idCargaSearchField").getValue();
            var sDateValue = this.byId("fechaCargaField").getDateValue();
            var sUserValue = this.byId("usuarioSelectField").getValue();
            var sStateValue = this.byId("estadoSelectField").getSelectedKey();
            var that = this;
            var aFilters = [];
            if (sSearchValue) {
                aFilters.push(new Filter("UploadUuid", FilterOperator.EQ, sSearchValue));
            }
            if (sDateValue) {
                let nDateValue = new Date(sDateValue);
                nDateValue.setDate(nDateValue.getDate() + 1);
                aFilters.push(new Filter({filters: [
                    new Filter("LocalCreatedAt", FilterOperator.GE, sDateValue.toISOString()),
                    new Filter("LocalCreatedAt", FilterOperator.LT, nDateValue.toISOString())
                ], and: true}));
            }
            if (sUserValue) {
                aFilters.push(new Filter("LocalCreatedBy", FilterOperator.EQ, sUserValue));
            }
            if (sStateValue && sStateValue !== "Todos") {
                aFilters.push(new Filter("Status", FilterOperator.EQ, sStateValue));
            }

            try {
                oTable.getBinding("items").filter(aFilters);                
            } catch (error) {
                that.onMessageDialogPress("Error al aplicar filtros: " + error.message);
            }
        },

        onLimpiar: function () {
            var oTable = this.byId("idCargaTable");
            oTable.getBinding("items").filter([]);
            this.byId("idCargaSearchField").setValue("");
            this.byId("fechaCargaField").setDateValue(null);
            this.byId("usuarioSelectField").setValue("");
            this.byId("estadoSelectField").setSelectedKey("Todos");
        },

        onReadParams: async function () {
            let oComponentData = this.getOwnerComponent().getComponentData();
            if (oComponentData && oComponentData.startupParameters) {
                let sIdCarga = oComponentData.startupParameters.IdCarga && oComponentData.startupParameters.IdCarga[0];
                if (sIdCarga) {
                    this.byId("idCargaInput").setValue(sIdCarga);
                    await this.onSearchCarga(sIdCarga);
                }
            }
        },

        onSearchCarga: async function (sIdCarga) {
            const oModel = this.getOwnerComponent().getModel("oMainModel");
            const sPath = "/CargaMasiva('" + sIdCarga + "')";
            var that = this;
             try {
                const oContextBinding = oModel.bindContext(sPath);
                const oData = await oContextBinding.requestObject();
                that.setCargaValuesToInput(oData);
            } catch (oError) {                
                // console.error("Error al leer producto", oError);
                that.onMessageDialogPress("No se encontró la carga con Id: " + sIdCarga);
            }
        },

        onMessageDialogPress: function (sMessage) {
			if (!this.oEscapePreventDialog) {
				this.oEscapePreventDialog = new Dialog({
					title: "Aviso",
					content: new Text({ text: sMessage }).addStyleClass("sapUiSmallMargin"),
					buttons: [
						new Button({
							type: ButtonType.Emphasized,
							text: "Cerrar",
							press: function () {
								this.oEscapePreventDialog.close();
							}.bind(this)
						})
					]
				});
			}

			this.oEscapePreventDialog.open();
		}        
    });
});