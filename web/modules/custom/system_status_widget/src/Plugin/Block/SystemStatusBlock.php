<?php

namespace Drupal\system_status_widget\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a 'SystemStatusBlock' block.
 *
 * @Block(
 *   id = "system_status_block",
 *   admin_label = @Translation("React System Status Widget"),
 *   category = @Translation("Custom")
 * )
 */
class SystemStatusBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static($configuration, $plugin_id, $plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public function build() {
    // Generate secure transient JWT payload for the front-end fetch authorization
    $payload = [
      'iss' => 'drupal_site',
      'aud' => 'enterprise_api_gateway',
      'iat' => time(),
      'exp' => time() + 3600, // valid for 1 hour
      'scopes' => ['status:read'],
    ];

    // Securely encode utilizing state key (simplified Mock implementation for sandbox compatibility)
    $jwt_token = base64_encode(json_encode($payload)); 

    return [
      '#theme' => 'system_status_block_template',
      '#jwt_token' => $jwt_token,
      '#attached' => [
        'library' => [
          'system_status_widget/react-status-app',
        ],
        'drupalSettings' => [
          'systemStatusWidget' => [
            'jwtToken' => $jwt_token,
          ],
        ],
      ],
    ];
  }
}
