--
--   This file is part of the html5 pivotviewer project
--
--   Copyright (C) 2014 OpenLink Software
--
--   This project is free software; you can redistribute it and/or modify it
--   under the terms of the GNU General Public License as published by the
--   Free Software Foundation; only version 2 of the License, dated June 1991.
--
--   This program is distributed in the hope that it will be useful, but
--   WITHOUT ANY WARRANTY; without even the implied warranty of
--   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
--   General Public License for more details.
--
--   You should have received a copy of the GNU General Public License along
--   with this program; if not, write to the Free Software Foundation, Inc.,
--   51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
--

-- Create the HtmlPivotViewer scope

SPARQL 
PREFIX acl: <http://www.w3.org/ns/auth/acl#>
PREFIX oplacl: <http://www.openlinksw.com/ontology/acl#>
INSERT INTO <urn:virtuoso:val:acl:schema> {
  <urn:virtuoso:val:scopes:pivotviewer> a oplacl:Scope ;
    rdfs:label "HtmlPivotViewer" ;
    rdfs:comment """SQL ACL scope which contains all ACL rules granting permission to use the HtmlPivotViewer to visualize collections.""" ;
    oplacl:hasApplicableAccess oplacl:Read .
};

-- Enable the HtmlPivotViewer scope

create procedure 
DB.DBA.PV_VAL_ENABLE_HTMLPIVOTVIEWER_SCOPE ()
{
	declare default_realm varchar;
	declare acl_graph varchar;
        declare qry varchar;
        declare stat, msg, meta, data any;

	default_realm := VAL.DBA.get_default_realm ();
	acl_graph := VAL.DBA.val_acl_rule_graph(default_realm);

	exec (sprintf ('SPARQL
		PREFIX oplacl: <http://www.openlinksw.com/ontology/acl#>
		WITH <urn:virtuoso:val:config>
		INSERT {
		    <%s> oplacl:hasEnabledAclScope <urn:virtuoso:val:scopes:pivotviewer> .
			}',  acl_graph), stat, msg, vector(), 1, meta, data);

};

DB.DBA.PV_VAL_ENABLE_HTMLPIVOTVIEWER_SCOPE ();


-- NetID Conditional Group Description & Loading Template

create procedure 
DB.DBA.PV_VAL_CREATE_CONDITIONAL_GROUP ()
{
	declare default_realm varchar;
	declare acl_graph varchar;
        declare qry varchar;
        declare stat, msg, meta, data any;

	default_realm := VAL.DBA.get_default_realm ();
	acl_graph := VAL.DBA.val_acl_group_graph(default_realm);

	exec (sprintf ('SPARQL
			PREFIX acl: <http://www.w3.org/ns/auth/acl#>
			PREFIX oplacl: <http://www.openlinksw.com/ontology/acl#>
			PREFIX foaf: <http://xmlns.com/foaf/0.1/>

			WITH GRAPH <%s>

			INSERT {
				<#HtmlPivotViewerNetID>
				a oplacl:ConditionalGroup ;
				foaf:name ''Identities names using a NetID based Identifier'' ;
				oplacl:hasCondition [
				a
				oplacl:GroupCondition,
				oplacl:GenericCondition ;
				oplacl:hasCriteria
				oplacl:NetID ;
				oplacl:hasComparator
				oplacl:IsNotNull ;
				oplacl:hasValue ''1''^^xsd:boolean
                                  ] .
			}',  acl_graph), stat, msg, vector(), 1, meta, data);

};

DB.DBA.PV_VAL_CREATE_CONDITIONAL_GROUP ();

-- ACL Description & Loading Template

create procedure
DB.DBA.PV_VAL_CREATE_ACL_RULE()
{

	declare default_realm varchar;
	declare acl_graph varchar;
	declare dba_id varchar;
        declare qry varchar;
        declare stat, msg, meta, data any;

	default_realm := VAL.DBA.get_default_realm ();
	acl_graph := VAL.DBA.val_acl_rule_graph(default_realm);
	dba_id := VAL.DBA.user_personal_uri ('dba');

	exec (sprintf ('SPARQL
			PREFIX acl: <http://www.w3.org/ns/auth/acl#>
			PREFIX oplacl: <http://www.openlinksw.com/ontology/acl#>
			PREFIX foaf: <http://xmlns.com/foaf/0.1/>

			WITH GRAPH <%s>

			INSERT {
				<#NetIDPivotViewerAccessRule1>  a acl:Authorization ;
				rdfs:comment """This ACL rule grants HtmlPivotViewer access to any identity denoted by a URI where identity claims are de-referenced and then verified using a variety of authentication protocols e.g., HTTP Digest, TLS basic, OAuth, WebID-TLS, OpenID, or Mozilla Persona """ ;
				foaf:maker <%s> ;
				acl:accessTo <urn:virtuoso:access:pivotviewer> ;
				oplacl:hasAccessMode oplacl:Read ;
				acl:agent <#HtmlPivotViewerNetID> ;
				oplacl:hasRealm oplacl:DefaultRealm ;
				oplacl:hasScope <urn:virtuoso:val:scopes:pivotviewer> .
			}',  acl_graph, dba_id), stat, msg, vector(), 1, meta, data);
};

DB.DBA.PV_VAL_CREATE_ACL_RULE();
