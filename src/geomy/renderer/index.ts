/**
 * Rendering is broken into 2 phases:
 * * Preprocessing: Filtering, Clustering, Generalization, Heat Maps, Voronai, Label Placement,
 * * Drawing : Converting features to SVG, Canvas, or whatever else
 * Features are grouped into layers. 
 * Should each layer hold multiple tiles?
 * Should Preprocessing produce a vector tile
 *  
 * 
 * Render pipeline:
 * - Selection:
 *   - Select layers
 *   - Select features from layers filtered by bounds / other criteria
 * - Processing
 *   - Transforming
 *   - Translation / Scaling
 *   - Clustering
 *   - Generalizing
 *   - Heatmap
 *   - Label Placement
 *   - Voronai
 *   - etc...
 * - Render
 *   - SVG
 *   - Canvas
 *   - etc... (Maybe vector tile?)
 
 *
 * Processing may be based on the current view or global. Anything global may be preprocessable
 * Anything non global may be agressively cached.
 * 
 * For example, generalization / clustering: This can be done for the whole layer at various zoom levels.
 * So selection at this point becomes go to the generalization table and select the layer_id and zoom level
 * and select by id.
 * 
 * Heatmap - generates a mesh for the whole layer with values. These are then clustered.
 * 
 * So meta items becomes:
 * 
 * Layer: {
 *   id: string (lower case letters, underscores and numbers. Must start with letter. Unique)
 *   bounds: Rectangle   # Derived from features
 *   minZOrder: BigInt
 *   maxZOrder: BigInt
 *   created_at datetime
 *   updated_at datetime  # Derived from features
 *   layer_i18ns: has_many layer_i18n
 *   default_style: Style  # Polymorphic - possibly inline
 *   minResolution: number
 *   maxResolution: number
 * }
 * 
 * LayerDescription {
 *   id: uuid
 *   locale: locale
 *   title: string
 *   description: string
 *   created_at datetime
 *   updated_at datetime
 *   layer: has_one layer
 * }
 * 
 * Map {
 *   id: uuid
 *   projection: Projection
 *   bounds: Rectangle  # derived from features
 *   minZOrder: BigInt
 *   maxZOrder: BigInt
 *   created_at datetime
 *   updated_at datetime  # Derived from features
 * }
 * 
 * MapDescription {
 *   id: uuid
 *   locale: locale
 *   title: string
 *   description: string
 *   created_at datetime
 *   updated_at datetime
 *   map: has_one Map
 * }
 * 
 * MapLayer {
 *   map: has_one Map
 *   layer: has_one Layer
 *   style: Style  # Polymorphic - possibly inline
 *   min_resolution: number
 *   max_resolution: number
 * }
 * 
 * ProcessingTask {
 *   id: uuid
 *   status: [READY|QUEUED|RUNNING|CANCELLED|ERROR|COMPLETED]
 *   progress: nullable float
 *   owner: user_id
 *   job_type: string
 *   meta: json  # Depends on job type
 *   created_at: datetime
 *   updated_at: datetime
 * }
 * 
 * Generalization {
 *   id: uuid
 *   map: Map
 *   geometry: Geometry
 *   bounds: Rectangle  # derived from features
 *   minZ: BigInt
 *   maxZ: BigInt
 *   created_at: datetime
 *   updated_at: datetime
 * }
 * 
 * GeneralizationFeature {
 *   generalization: Generalization
 *   feature: Feature
 * }
 */
