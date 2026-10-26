"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def favicon_view(request):
    svg_icon = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        '<circle cx="50" cy="50" r="46" fill="#f59e0b" stroke="#b45309" stroke-width="4"/>'
        '<circle cx="50" cy="50" r="36" fill="#fbbf24"/>'
        '<text x="50" y="66" font-size="48" font-family="sans-serif" font-weight="900" '
        'text-anchor="middle" fill="#78350f">Q</text>'
        '</svg>'
    )
    return HttpResponse(svg_icon, content_type='image/svg+xml')

urlpatterns = [
    path('favicon.ico', favicon_view, name='favicon'),
    path('admin/', admin.site.urls),
    path('', include('game.urls')),
]


