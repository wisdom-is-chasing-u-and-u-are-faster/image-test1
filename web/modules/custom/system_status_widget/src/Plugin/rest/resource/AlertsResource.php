<?php

namespace Drupal\system_status_widget\Plugin\rest\resource;

use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Provides a REST Resource for Alerts reception and homepage cache purges.
 *
 * @RestResource(
 *   id = "alerts_resource",
 *   label = @Translation("Emergency Alerts API Gateway Resource"),
 *   uri_paths = {
 *     "create" = "/api/v1/alerts"
 *   }
 * )
 */
class AlertsResource extends ResourceBase {

  /**
   * Responds to POST requests.
   */
  public function post(array $data, Request $request) {
    // 1. Verify authorization headers and mock secure JWT validation
    $auth_header = $request->headers->get('Authorization');
    if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
      throw new AccessDeniedHttpException('Missing or invalid Authorization payload.');
    }

    // 2. Validate payload structure
    if (empty($data['alert_level']) || empty($data['message'])) {
      throw new BadRequestHttpException('Invalid request payload. Missing alert_level or message.');
    }

    // 3. Trigger Homepage Cache invalidation via cache tags
    if (function_exists('drupal_static_reset')) {
      // Standard programmatic tag purging
      \Drupal::service('cache_tags.invalidator')->invalidateTags(['front', 'rendered']);
    }

    $response_payload = [
      'status' => 'success',
      'message' => 'Emergency alert received and homepage caches successfully invalidated.',
      'purged_tags' => ['front', 'rendered'],
    ];

    return new ResourceResponse($response_payload, 201);
  }
}
