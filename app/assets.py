from flask_assets import Bundle, Environment

def register_assets(app):
    assets = Environment(app)
    assets.url = app.static_url_path
    assets.url_expire = True  # Enable URL expiration for assets   
    assets.manifest = 'file'  # Use file-based manifest for cache busting
    assets.cache = False  # Disable caching for development; set to True in production
    assets.debug = True  # Enable debug mode for development; set to False in production 

    css_bundle = Bundle(
        'css/variables.css',
        'css/components.css',
        'css/layout.css',
        'css/animations.css', 
        filters='cssmin',
        output='gen/css/main.min.css'
    )

    assets.register('css_all', css_bundle)