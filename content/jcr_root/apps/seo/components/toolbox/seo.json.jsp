<%@page session="false" contentType="application/json" pageEncoding="utf-8" %><%
%><%@page import="
    java.util.Iterator,
    com.day.cq.wcm.api.components.IncludeOptions,
    org.apache.sling.commons.json.JSONObject
" %><%@include file="/libs/foundation/global.jsp"%><%
    response.setContentType("application/json");
    final Iterator<Resource> tools = resource.getChild("tools").listChildren();
    JSONObject json = new JSONObject();
    request.setAttribute("seo-json", json);
    while (tools.hasNext()) {
        final Resource tool = tools.next();
        IncludeOptions.getOptions(request, true).forceSameContext(true);
        sling.include(tool);
    }
    out.append(json.toString());
%>